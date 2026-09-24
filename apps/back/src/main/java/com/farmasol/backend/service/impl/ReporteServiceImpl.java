package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.reporte.PedidosPorEstadoDTO;
import com.farmasol.backend.dto.reporte.ProductoMasVendidoDTO;
import com.farmasol.backend.dto.reporte.StockBajoDTO;
import com.farmasol.backend.dto.reporte.VentasPorPeriodoDTO;
import com.farmasol.backend.model.enums.EstadoPedido;
import com.farmasol.backend.repository.PedidoRepository;
import com.farmasol.backend.repository.ProductoRepository;
import com.farmasol.backend.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReporteServiceImpl implements ReporteService {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VentasPorPeriodoDTO> ventasPorPeriodo(LocalDate desde, LocalDate hasta) {
        LocalDate[] rango = rango(desde, hasta);
        return pedidoRepository.reporteVentasPorDia(inicio(rango[0]), fin(rango[1])).stream()
                .map(f -> VentasPorPeriodoDTO.builder()
                        .dia(aLocalDate(f[0]))
                        .cantidadPedidos(((Number) f[1]).longValue())
                        .monto(aBigDecimal(f[2]))
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoMasVendidoDTO> productosMasVendidos(LocalDate desde, LocalDate hasta, int limit) {
        LocalDate[] rango = rango(desde, hasta);
        return pedidoRepository.reporteProductosMasVendidos(inicio(rango[0]), fin(rango[1])).stream()
                .limit(limit <= 0 ? 10 : limit)
                .map(f -> ProductoMasVendidoDTO.builder()
                        .idProducto(f[0] != null ? ((Number) f[0]).longValue() : null)
                        .nombreProducto((String) f[1])
                        .unidadesVendidas(((Number) f[2]).longValue())
                        .montoTotal(aBigDecimal(f[3]))
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockBajoDTO> stockBajo(int umbral) {
        int u = umbral <= 0 ? 10 : umbral;
        return productoRepository.findByStockLessThanEqualAndActivoTrue(u).stream()
                .map(p -> StockBajoDTO.builder()
                        .idProducto(p.getId())
                        .nombre(p.getNombre())
                        .categoria(p.getCategoria() != null ? p.getCategoria().getNombre() : null)
                        .stock(p.getStock())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PedidosPorEstadoDTO> pedidosPorEstado(LocalDate desde, LocalDate hasta) {
        LocalDate[] rango = rango(desde, hasta);
        return pedidoRepository.reportePedidosPorEstado(inicio(rango[0]), fin(rango[1])).stream()
                .map(f -> PedidosPorEstadoDTO.builder()
                        .estado((EstadoPedido) f[0])
                        .cantidad(((Number) f[1]).longValue())
                        .monto(aBigDecimal(f[2]))
                        .build())
                .toList();
    }

    private LocalDate[] rango(LocalDate desde, LocalDate hasta) {
        LocalDate fin = hasta != null ? hasta : LocalDate.now();
        LocalDate ini = desde != null ? desde : fin.minusDays(30);
        return new LocalDate[]{ini, fin};
    }

    private LocalDateTime inicio(LocalDate d) {
        return d.atStartOfDay();
    }

    private LocalDateTime fin(LocalDate d) {
        return d.atTime(LocalTime.MAX);
    }

    private LocalDate aLocalDate(Object o) {
        if (o instanceof Date d) {
            return d.toLocalDate();
        }
        if (o instanceof LocalDate ld) {
            return ld;
        }
        return LocalDate.parse(o.toString());
    }

    private BigDecimal aBigDecimal(Object o) {
        return o == null ? BigDecimal.ZERO : new BigDecimal(o.toString());
    }
}

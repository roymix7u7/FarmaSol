package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.reporte.PedidosPorEstadoDTO;
import com.farmasol.backend.dto.reporte.ProductoMasVendidoDTO;
import com.farmasol.backend.dto.reporte.StockBajoDTO;
import com.farmasol.backend.dto.reporte.VentasPorPeriodoDTO;
import com.farmasol.backend.model.enums.EstadoPedido;
import com.farmasol.backend.repository.PedidoRepository;
import com.farmasol.backend.repository.ProductoRepository;
import com.farmasol.backend.repository.VentaRepository;
import com.farmasol.backend.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class ReporteServiceImpl implements ReporteService {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final VentaRepository ventaRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VentasPorPeriodoDTO> ventasPorPeriodo(LocalDate desde, LocalDate hasta) {
        LocalDate[] rango = rango(desde, hasta);
        // Web y tienda se suman por día: un reporte de ventas que dejara fuera el
        // mostrador mostraría menos de lo que entró en caja.
        Map<LocalDate, VentasPorPeriodoDTO> porDia = new TreeMap<>();
        for (Object[] f : pedidoRepository.reporteVentasPorDia(inicio(rango[0]), fin(rango[1]))) {
            porDia.put(aLocalDate(f[0]), VentasPorPeriodoDTO.builder()
                    .dia(aLocalDate(f[0]))
                    .cantidadPedidos(((Number) f[1]).longValue())
                    .monto(aBigDecimal(f[2]))
                    .cantidadPresencial(0)
                    .montoPresencial(BigDecimal.ZERO)
                    .build());
        }
        for (Object[] f : ventaRepository.reporteVentasPorDia(inicio(rango[0]), fin(rango[1]))) {
            LocalDate dia = aLocalDate(f[0]);
            long cantidad = ((Number) f[1]).longValue();
            BigDecimal monto = aBigDecimal(f[2]);
            VentasPorPeriodoDTO d = porDia.computeIfAbsent(dia, k -> VentasPorPeriodoDTO.builder()
                    .dia(k).cantidadPedidos(0).monto(BigDecimal.ZERO)
                    .cantidadPresencial(0).montoPresencial(BigDecimal.ZERO).build());
            d.setCantidadPedidos(d.getCantidadPedidos() + cantidad);
            d.setMonto(d.getMonto().add(monto));
            d.setCantidadPresencial(cantidad);
            d.setMontoPresencial(monto);
        }
        return List.copyOf(porDia.values());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoMasVendidoDTO> productosMasVendidos(LocalDate desde, LocalDate hasta, int limit) {
        LocalDate[] rango = rango(desde, hasta);
        // Se juntan las unidades de web y de tienda antes de ordenar: un producto
        // que se vende mucho en mostrador también es de los más vendidos.
        Map<String, ProductoMasVendidoDTO> porProducto = new LinkedHashMap<>();
        List<Object[]> filas = new ArrayList<>(
                pedidoRepository.reporteProductosMasVendidos(inicio(rango[0]), fin(rango[1])));
        filas.addAll(ventaRepository.reporteProductosVendidos(inicio(rango[0]), fin(rango[1])));
        for (Object[] f : filas) {
            Long id = f[0] != null ? ((Number) f[0]).longValue() : null;
            String nombre = (String) f[1];
            // Si el producto se borró, el id es nulo: se agrupa por el nombre guardado.
            String clave = id != null ? "id:" + id : "nombre:" + nombre;
            long unidades = ((Number) f[2]).longValue();
            BigDecimal monto = aBigDecimal(f[3]);
            porProducto.merge(clave,
                    ProductoMasVendidoDTO.builder()
                            .idProducto(id).nombreProducto(nombre)
                            .unidadesVendidas(unidades).montoTotal(monto).build(),
                    (a, b) -> {
                        a.setUnidadesVendidas(a.getUnidadesVendidas() + b.getUnidadesVendidas());
                        a.setMontoTotal(a.getMontoTotal().add(b.getMontoTotal()));
                        return a;
                    });
        }
        return porProducto.values().stream()
                .sorted(Comparator.comparingLong(ProductoMasVendidoDTO::getUnidadesVendidas).reversed())
                .limit(limit <= 0 ? 10 : limit)
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

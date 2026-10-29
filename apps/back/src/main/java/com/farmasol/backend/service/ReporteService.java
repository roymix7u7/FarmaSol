package com.farmasol.backend.service;

import com.farmasol.backend.dto.reporte.PedidosPorEstadoDTO;
import com.farmasol.backend.dto.reporte.ProductoMasVendidoDTO;
import com.farmasol.backend.dto.reporte.StockBajoDTO;
import com.farmasol.backend.dto.reporte.VentasPorPeriodoDTO;

import java.time.LocalDate;
import java.util.List;

public interface ReporteService {

    List<VentasPorPeriodoDTO> ventasPorPeriodo(LocalDate desde, LocalDate hasta);

    List<ProductoMasVendidoDTO> productosMasVendidos(LocalDate desde, LocalDate hasta, int limit);

    List<StockBajoDTO> stockBajo(int umbral);

    List<PedidosPorEstadoDTO> pedidosPorEstado(LocalDate desde, LocalDate hasta);
}

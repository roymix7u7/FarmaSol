package com.farmasol.backend.controller;

import com.farmasol.backend.dto.reporte.PedidosPorEstadoDTO;
import com.farmasol.backend.dto.reporte.ProductoMasVendidoDTO;
import com.farmasol.backend.dto.reporte.StockBajoDTO;
import com.farmasol.backend.dto.reporte.VentasPorPeriodoDTO;
import com.farmasol.backend.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/ventas")
    public ResponseEntity<List<VentasPorPeriodoDTO>> ventas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.ventasPorPeriodo(desde, hasta));
    }

    @GetMapping("/productos-mas-vendidos")
    public ResponseEntity<List<ProductoMasVendidoDTO>> productosMasVendidos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(reporteService.productosMasVendidos(desde, hasta, limit));
    }

    @GetMapping("/stock-bajo")
    public ResponseEntity<List<StockBajoDTO>> stockBajo(@RequestParam(defaultValue = "10") int umbral) {
        return ResponseEntity.ok(reporteService.stockBajo(umbral));
    }

    @GetMapping("/pedidos-por-estado")
    public ResponseEntity<List<PedidosPorEstadoDTO>> pedidosPorEstado(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.pedidosPorEstado(desde, hasta));
    }
}
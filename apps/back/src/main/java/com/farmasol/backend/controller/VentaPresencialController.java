package com.farmasol.backend.controller;

import com.farmasol.backend.dto.venta.AnularVentaRequest;
import com.farmasol.backend.dto.venta.ResumenCajaDTO;
import com.farmasol.backend.dto.venta.VentaRequest;
import com.farmasol.backend.dto.venta.VentaResponse;
import com.farmasol.backend.service.VentaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Punto de venta: cobros en el mostrador. */
@RestController
@RequestMapping("/api/ventas-presenciales")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
public class VentaPresencialController {

    private final VentaService ventaService;

    @PostMapping
    public ResponseEntity<VentaResponse> registrar(@Valid @RequestBody VentaRequest request) {
        return new ResponseEntity<>(ventaService.registrar(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<VentaResponse>> delDia(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ventaService.listarDelDia(fecha));
    }

    @GetMapping("/resumen")
    public ResponseEntity<ResumenCajaDTO> resumen(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ventaService.resumenCaja(fecha));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VentaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(ventaService.obtener(id));
    }

    @PatchMapping("/{id}/anular")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<VentaResponse> anular(@PathVariable Long id,
                                                @Valid @RequestBody AnularVentaRequest request) {
        return ResponseEntity.ok(ventaService.anular(id, request.getMotivo()));
    }
}

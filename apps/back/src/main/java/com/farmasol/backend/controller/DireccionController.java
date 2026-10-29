package com.farmasol.backend.controller;

import com.farmasol.backend.dto.direccion.DireccionRequest;
import com.farmasol.backend.dto.direccion.DireccionResponse;
import com.farmasol.backend.security.SecurityUtils;
import com.farmasol.backend.service.DireccionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/direcciones")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class DireccionController {

    private final DireccionService direccionService;

    @GetMapping
    public ResponseEntity<List<DireccionResponse>> listar() {
        return ResponseEntity.ok(direccionService.listarDeCliente(SecurityUtils.getUidActual()));
    }

    @PostMapping
    public ResponseEntity<DireccionResponse> crear(@Valid @RequestBody DireccionRequest request) {
        DireccionResponse creada = direccionService.crear(SecurityUtils.getUidActual(), request);
        return new ResponseEntity<>(creada, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DireccionResponse> actualizar(@PathVariable Long id,
                                                        @Valid @RequestBody DireccionRequest request) {
        return ResponseEntity.ok(direccionService.actualizar(SecurityUtils.getUidActual(), id, request));
    }

    @PatchMapping("/{id}/predeterminada")
    public ResponseEntity<Void> marcarPredeterminada(@PathVariable Long id) {
        direccionService.marcarPredeterminada(SecurityUtils.getUidActual(), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        direccionService.eliminar(SecurityUtils.getUidActual(), id);
        return ResponseEntity.noContent().build();
    }
}

package com.farmasol.backend.controller;

import com.farmasol.backend.dto.incidencia.IncidenciaRequest;
import com.farmasol.backend.dto.incidencia.IncidenciaResponse;
import com.farmasol.backend.dto.incidencia.ResolverIncidenciaRequest;
import com.farmasol.backend.model.enums.EstadoIncidencia;
import com.farmasol.backend.service.IncidenciaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Reportes internos: el trabajador avisa de un problema y el gerente lo resuelve. */
@RestController
@RequestMapping("/api/incidencias")
@RequiredArgsConstructor
public class IncidenciaController {

    private final IncidenciaService incidenciaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<IncidenciaResponse> reportar(@Valid @RequestBody IncidenciaRequest request) {
        return new ResponseEntity<>(incidenciaService.reportar(request), HttpStatus.CREATED);
    }

    @GetMapping("/mias")
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<List<IncidenciaResponse>> misReportes() {
        return ResponseEntity.ok(incidenciaService.misReportes());
    }

    @GetMapping
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<List<IncidenciaResponse>> listar(@RequestParam(required = false) EstadoIncidencia estado) {
        return ResponseEntity.ok(incidenciaService.listar(estado));
    }

    @PatchMapping("/{id}/resolver")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<IncidenciaResponse> resolver(@PathVariable Long id,
                                                       @Valid @RequestBody(required = false) ResolverIncidenciaRequest request) {
        return ResponseEntity.ok(incidenciaService.resolver(id, request));
    }
}

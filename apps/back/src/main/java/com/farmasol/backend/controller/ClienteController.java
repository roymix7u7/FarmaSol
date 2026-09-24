package com.farmasol.backend.controller;

import com.farmasol.backend.dto.cliente.ClienteResponse;
import com.farmasol.backend.dto.cliente.ClienteUpdateRequest;
import com.farmasol.backend.security.SecurityUtils;
import com.farmasol.backend.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<ClienteResponse> miPerfil() {
        return ResponseEntity.ok(clienteService.obtenerPerfil(SecurityUtils.getUidActual()));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<ClienteResponse> actualizarMiPerfil(@Valid @RequestBody ClienteUpdateRequest request) {
        return ResponseEntity.ok(clienteService.actualizarPerfil(SecurityUtils.getUidActual(), request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<List<ClienteResponse>> listar() {
        return ResponseEntity.ok(clienteService.listar());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<ClienteResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.obtenerPorId(id));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<Void> cambiarEstado(@PathVariable Long id, @RequestParam boolean activo) {
        clienteService.cambiarEstado(id, activo);
        return ResponseEntity.noContent().build();
    }
}
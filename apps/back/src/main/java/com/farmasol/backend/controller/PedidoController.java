package com.farmasol.backend.controller;

import com.farmasol.backend.dto.pedido.CambiarEstadoRequest;
import com.farmasol.backend.dto.pedido.CheckoutRequest;
import com.farmasol.backend.dto.pedido.PedidoResponse;
import com.farmasol.backend.dto.pedido.PedidoResumenResponse;
import com.farmasol.backend.model.enums.EstadoPedido;
import com.farmasol.backend.security.SecurityUtils;
import com.farmasol.backend.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<List<PedidoResponse>> checkout(@Valid @RequestBody CheckoutRequest request) {
        List<PedidoResponse> pedidos = pedidoService.checkout(SecurityUtils.getUidActual(), request);
        return new ResponseEntity<>(pedidos, HttpStatus.CREATED);
    }

    @GetMapping("/mios")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<List<PedidoResumenResponse>> mios() {
        return ResponseEntity.ok(pedidoService.listarDeCliente(SecurityUtils.getUidActual()));
    }

    @GetMapping("/mios/{id}")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<PedidoResponse> mio(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.obtenerDeCliente(SecurityUtils.getUidActual(), id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<List<PedidoResumenResponse>> listar(
            @RequestParam(required = false) EstadoPedido estado) {
        return ResponseEntity.ok(pedidoService.listarTodos(estado));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<PedidoResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.obtenerAdmin(id));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<PedidoResponse> cambiarEstado(@PathVariable Long id,
                                                        @Valid @RequestBody CambiarEstadoRequest request) {
        return ResponseEntity.ok(pedidoService.cambiarEstado(
                SecurityUtils.getUidActual(), id, request.getNuevoEstado()));
    }
}
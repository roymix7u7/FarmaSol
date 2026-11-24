package com.farmasol.backend.controller;

import com.farmasol.backend.dto.carrito.ActualizarCantidadRequest;
import com.farmasol.backend.dto.carrito.AgregarItemRequest;
import com.farmasol.backend.dto.carrito.CarritoResponse;
import com.farmasol.backend.security.SecurityUtils;
import com.farmasol.backend.service.CarritoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/carrito")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class CarritoController {

    private final CarritoService carritoService;

    @GetMapping
    public ResponseEntity<CarritoResponse> ver() {
        return ResponseEntity.ok(carritoService.verCarrito(SecurityUtils.getUidActual()));
    }

    @PostMapping("/items")
    public ResponseEntity<CarritoResponse> agregar(@Valid @RequestBody AgregarItemRequest request) {
        return ResponseEntity.ok(carritoService.agregarItem(SecurityUtils.getUidActual(), request));
    }

    @PutMapping("/items/{idProducto}")
    public ResponseEntity<CarritoResponse> actualizar(@PathVariable Long idProducto,
                                                      @Valid @RequestBody ActualizarCantidadRequest request) {
        return ResponseEntity.ok(carritoService.actualizarCantidad(
                SecurityUtils.getUidActual(), idProducto, request.getCantidad()));
    }

    @DeleteMapping("/items/{idProducto}")
    public ResponseEntity<CarritoResponse> eliminar(@PathVariable Long idProducto) {
        return ResponseEntity.ok(carritoService.eliminarItem(SecurityUtils.getUidActual(), idProducto));
    }

    @DeleteMapping
    public ResponseEntity<Void> vaciar() {
        carritoService.vaciar(SecurityUtils.getUidActual());
        return ResponseEntity.noContent().build();
    }
}

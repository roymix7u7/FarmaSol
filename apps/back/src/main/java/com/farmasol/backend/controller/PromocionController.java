package com.farmasol.backend.controller;

import com.farmasol.backend.dto.promocion.PromocionBannerResponse;
import com.farmasol.backend.dto.promocion.PromocionRequest;
import com.farmasol.backend.dto.promocion.PromocionResponse;
import com.farmasol.backend.service.PromocionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promociones")
@RequiredArgsConstructor
public class PromocionController {

    private final PromocionService promocionService;

    /** Carrusel del home. Público. */
    @GetMapping("/carrusel")
    public ResponseEntity<List<PromocionBannerResponse>> carrusel() {
        return ResponseEntity.ok(promocionService.listarCarrusel());
    }

    /** Lista completa. Público (solo lectura). */
    @GetMapping
    public ResponseEntity<List<PromocionResponse>> listar() {
        return ResponseEntity.ok(promocionService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PromocionResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(promocionService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<PromocionResponse> crear(@Valid @RequestBody PromocionRequest request) {
        return new ResponseEntity<>(promocionService.crear(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<PromocionResponse> actualizar(@PathVariable Long id,
                                                        @Valid @RequestBody PromocionRequest request) {
        return ResponseEntity.ok(promocionService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        promocionService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}

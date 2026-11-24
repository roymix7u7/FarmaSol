package com.farmasol.backend.controller;

import com.farmasol.backend.dto.banner.BannerRequest;
import com.farmasol.backend.dto.banner.BannerResponse;
import com.farmasol.backend.service.BannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
public class BannerController {

    private final BannerService bannerService;

    /** Carrusel de la página principal. Público: solo los vigentes hoy. */
    @GetMapping("/vigentes")
    public ResponseEntity<List<BannerResponse>> vigentes() {
        return ResponseEntity.ok(bannerService.listarVigentes());
    }

    @GetMapping
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<List<BannerResponse>> listar() {
        return ResponseEntity.ok(bannerService.listar());
    }

    @PostMapping
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<BannerResponse> crear(@Valid @RequestBody BannerRequest request) {
        return new ResponseEntity<>(bannerService.crear(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<BannerResponse> actualizar(@PathVariable Long id,
                                                     @Valid @RequestBody BannerRequest request) {
        return ResponseEntity.ok(bannerService.actualizar(id, request));
    }

    /** Encender o apagar un banner sin abrir el formulario. Body: {"activo": true}. */
    @PatchMapping("/{id}/activo")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<BannerResponse> cambiarActivo(@PathVariable Long id,
                                                        @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(bannerService.cambiarActivo(id, Boolean.TRUE.equals(body.get("activo"))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        bannerService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

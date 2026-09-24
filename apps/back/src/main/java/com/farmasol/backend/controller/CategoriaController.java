package com.farmasol.backend.controller;

import com.farmasol.backend.dto.categoria.CategoriaRequest;
import com.farmasol.backend.dto.categoria.CategoriaResponse;
import com.farmasol.backend.service.CategoriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService categoriaService;

    /** Árbol de categorías (raíces con subcategorías). Público. */
    @GetMapping
    public ResponseEntity<List<CategoriaResponse>> listar(
            @RequestParam(defaultValue = "true") boolean arbol) {
        return ResponseEntity.ok(arbol ? categoriaService.listarArbol() : categoriaService.listarPlano());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoriaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(categoriaService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<CategoriaResponse> crear(@Valid @RequestBody CategoriaRequest request) {
        return new ResponseEntity<>(categoriaService.crear(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<CategoriaResponse> actualizar(@PathVariable Long id,
                                                        @Valid @RequestBody CategoriaRequest request) {
        return ResponseEntity.ok(categoriaService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        categoriaService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
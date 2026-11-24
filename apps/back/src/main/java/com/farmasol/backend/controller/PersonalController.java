package com.farmasol.backend.controller;

import com.farmasol.backend.dto.personal.PersonalRequest;
import com.farmasol.backend.dto.personal.PersonalResponse;
import com.farmasol.backend.security.SecurityUtils;
import com.farmasol.backend.service.PersonalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/personal")
@RequiredArgsConstructor
@PreAuthorize("hasRole('GERENTE')")
public class PersonalController {

    private final PersonalService personalService;

    @GetMapping
    public ResponseEntity<List<PersonalResponse>> listar() {
        return ResponseEntity.ok(personalService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonalResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(personalService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<PersonalResponse> crear(@Valid @RequestBody PersonalRequest request) {
        PersonalResponse creado = personalService.crear(request, SecurityUtils.getUidActual());
        return new ResponseEntity<>(creado, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonalResponse> actualizar(@PathVariable Long id,
                                                       @Valid @RequestBody PersonalRequest request) {
        return ResponseEntity.ok(personalService.actualizar(id, request));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<Void> cambiarEstado(@PathVariable Long id, @RequestParam boolean activo) {
        personalService.cambiarEstado(id, activo);
        return ResponseEntity.noContent().build();
    }
}

package com.farmasol.backend.controller;

import com.farmasol.backend.model.Sede;
import com.farmasol.backend.repository.SedeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Sedes de FarmaSol para la opción "Retiro en Botica". Solo lectura, público. */
@RestController
@RequestMapping("/api/sedes")
@RequiredArgsConstructor
public class SedeController {

    private final SedeRepository sedeRepository;

    @GetMapping
    public ResponseEntity<List<Sede>> listar() {
        return ResponseEntity.ok(sedeRepository.findByActivoTrue());
    }
}

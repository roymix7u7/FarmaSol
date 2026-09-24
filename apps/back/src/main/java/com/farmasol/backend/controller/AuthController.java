package com.farmasol.backend.controller;

import com.farmasol.backend.dto.auth.AuthResponse;
import com.farmasol.backend.dto.auth.ClienteRegisterRequest;
import com.farmasol.backend.dto.auth.LoginRequest;
import com.farmasol.backend.dto.auth.UsuarioAutenticadoDTO;
import com.farmasol.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/cliente/register")
    public ResponseEntity<AuthResponse> registrarCliente(@Valid @RequestBody ClienteRegisterRequest request) {
        return new ResponseEntity<>(authService.registrarCliente(request), HttpStatus.CREATED);
    }

    @PostMapping("/cliente/login")
    public ResponseEntity<AuthResponse> loginCliente(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginCliente(request));
    }

    @PostMapping("/personal/login")
    public ResponseEntity<AuthResponse> loginPersonal(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginPersonal(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioAutenticadoDTO> me() {
        return ResponseEntity.ok(authService.getMe());
    }
}

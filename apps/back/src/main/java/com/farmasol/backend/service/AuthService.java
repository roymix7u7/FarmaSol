package com.farmasol.backend.service;

import com.farmasol.backend.dto.auth.AuthResponse;
import com.farmasol.backend.dto.auth.CambiarPasswordPersonalRequest;
import com.farmasol.backend.dto.auth.CambiarPasswordRequest;
import com.farmasol.backend.dto.auth.ClienteRegisterRequest;
import com.farmasol.backend.dto.auth.LoginRequest;
import com.farmasol.backend.dto.auth.UsuarioAutenticadoDTO;

public interface AuthService {
    AuthResponse registrarCliente(ClienteRegisterRequest request);
    AuthResponse loginCliente(LoginRequest request);
    AuthResponse loginPersonal(LoginRequest request);
    UsuarioAutenticadoDTO getMe();
    
    // ESTE es el método nuevo y correcto. 
    // Asegúrate de que NO exista ningún método que mencione "RecuperarPasswordRequest"
    void cambiarPassword(CambiarPasswordRequest request);
    void cambiarPasswordPersonal(CambiarPasswordPersonalRequest request);
}
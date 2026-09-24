package com.farmasol.backend.service;

import com.farmasol.backend.dto.auth.AuthResponse;
import com.farmasol.backend.dto.auth.ClienteRegisterRequest;
import com.farmasol.backend.dto.auth.LoginRequest;
import com.farmasol.backend.dto.auth.UsuarioAutenticadoDTO;

public interface AuthService {

    AuthResponse registrarCliente(ClienteRegisterRequest request);

    AuthResponse loginCliente(LoginRequest request);

    AuthResponse loginPersonal(LoginRequest request);

    UsuarioAutenticadoDTO getMe();
}

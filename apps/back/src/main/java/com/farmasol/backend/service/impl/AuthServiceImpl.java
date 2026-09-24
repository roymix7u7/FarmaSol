package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.auth.AuthResponse;
import com.farmasol.backend.dto.auth.ClienteRegisterRequest;
import com.farmasol.backend.dto.auth.LoginRequest;
import com.farmasol.backend.dto.auth.UsuarioAutenticadoDTO;
import com.farmasol.backend.exception.BusinessException;
import com.farmasol.backend.model.Cliente;
import com.farmasol.backend.model.Personal;
import com.farmasol.backend.repository.ClienteRepository;
import com.farmasol.backend.repository.PersonalRepository;
import com.farmasol.backend.security.JwtService;
import com.farmasol.backend.security.SecurityUtils;
import com.farmasol.backend.security.TipoUsuario;
import com.farmasol.backend.security.UsuarioAutenticado;
import com.farmasol.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final ClienteRepository clienteRepository;
    private final PersonalRepository personalRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional
    public AuthResponse registrarCliente(ClienteRegisterRequest request) {
        if (clienteRepository.existsByCorreo(request.getCorreo())) {
            throw new BusinessException("El correo ya está registrado");
        }
        if (clienteRepository.existsByDni(request.getDni())) {
            throw new BusinessException("El DNI / Cédula ya está registrado");
        }

        Cliente cliente = Cliente.builder()
                .nombres(request.getNombres())
                .apellidos(request.getApellidos())
                .usuario(request.getCorreo())
                .correo(request.getCorreo())
                .dni(request.getDni())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .telefono(request.getTelefono())
                .activo(true)
                .build();

        cliente = clienteRepository.save(cliente);
        return tokenPara(cliente);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse loginCliente(LoginRequest request) {
        Cliente cliente = clienteRepository.findByUsuarioAndActivoTrue(request.getUsuario())
                .orElseThrow(() -> new BadCredentialsException("Usuario o contraseña incorrectos"));
        if (!passwordEncoder.matches(request.getPassword(), cliente.getPasswordHash())) {
            throw new BadCredentialsException("Usuario o contraseña incorrectos");
        }
        return tokenPara(cliente);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse loginPersonal(LoginRequest request) {
        Personal personal = personalRepository.findByUsuarioAndActivoTrue(request.getUsuario())
                .orElseThrow(() -> new BadCredentialsException("Usuario o contraseña incorrectos"));
        if (!passwordEncoder.matches(request.getPassword(), personal.getPasswordHash())) {
            throw new BadCredentialsException("Usuario o contraseña incorrectos");
        }
        String nombres = personal.getNombres() + " " + personal.getApellidos();
        String token = jwtService.generarToken(TipoUsuario.PERSONAL, personal.getId(),
                personal.getUsuario(), personal.getRol().name(), nombres);
        return AuthResponse.builder()
                .token(token)
                .tipo(TipoUsuario.PERSONAL.name())
                .rol(personal.getRol().name())
                .uid(personal.getId())
                .nombres(nombres)
                .build();
    }

    @Override
    public UsuarioAutenticadoDTO getMe() {
        UsuarioAutenticado u = SecurityUtils.actual();
        return UsuarioAutenticadoDTO.builder()
                .tipo(u.getTipo().name())
                .uid(u.getUid())
                .usuario(u.getUsuario())
                .rol(u.getRol())
                .nombre(u.getNombre())
                .build();
    }

    private AuthResponse tokenPara(Cliente cliente) {
        String nombres = cliente.getNombres() + " " + cliente.getApellidos();
        String token = jwtService.generarToken(TipoUsuario.CLIENTE, cliente.getId(),
                cliente.getUsuario(), "CLIENTE", nombres);
        return AuthResponse.builder()
                .token(token)
                .tipo(TipoUsuario.CLIENTE.name())
                .rol("CLIENTE")
                .uid(cliente.getId())
                .nombres(nombres)
                .build();
    }
}

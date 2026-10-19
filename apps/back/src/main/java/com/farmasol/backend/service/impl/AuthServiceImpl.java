package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.auth.AuthResponse;
import com.farmasol.backend.dto.auth.CambiarPasswordPersonalRequest;
import com.farmasol.backend.dto.auth.CambiarPasswordRequest;
import com.farmasol.backend.dto.auth.ClienteRegisterRequest;
import com.farmasol.backend.dto.auth.LoginRequest;
import com.farmasol.backend.dto.auth.UsuarioAutenticadoDTO;
import com.farmasol.backend.exception.BusinessException;
import com.farmasol.backend.exception.CuentaBloqueadaException;
import com.farmasol.backend.model.Cliente;
import com.farmasol.backend.model.Personal;
import com.farmasol.backend.model.enums.TipoDocumento;
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

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final ClienteRepository clienteRepository;
    private final PersonalRepository personalRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /** Intentos fallidos seguidos que bloquean la cuenta del personal. */
    static final int MAX_INTENTOS = 3;
    /** Duración del bloqueo. */
    static final int MINUTOS_BLOQUEO = 15;

    @Override
    @Transactional
    public AuthResponse registrarCliente(ClienteRegisterRequest request) {
        if (clienteRepository.existsByCorreo(request.getCorreo())) {
            throw new BusinessException("El correo ya está registrado");
        }
        TipoDocumento tipo = request.getTipoDocumento() == null ? TipoDocumento.DNI : request.getTipoDocumento();
        // Se guarda normalizado: sin espacios y en mayúsculas, para que el mismo
        // carné escrito de dos formas no pase como dos documentos distintos.
        String numero = tipo.normalizar(request.getDni());
        if (clienteRepository.existsByDni(numero)) {
            throw new BusinessException("Ya existe una cuenta con ese número de documento");
        }

        Cliente cliente = Cliente.builder()
                .nombres(request.getNombres())
                .apellidos(request.getApellidos())
                .usuario(request.getCorreo())
                .correo(request.getCorreo())
                .tipoDocumento(tipo)
                .dni(numero)
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

    /**
     * Login del portal con bloqueo temporal tras {@value #MAX_INTENTOS} intentos fallidos.
     */
    @Override
    @Transactional(noRollbackFor = {BadCredentialsException.class, CuentaBloqueadaException.class})
    public AuthResponse loginPersonal(LoginRequest request) {
        Personal personal = personalRepository.findByUsuarioAndActivoTrue(request.getUsuario())
                .orElseThrow(() -> new BadCredentialsException("Usuario o contraseña incorrectos"));

        LocalDateTime ahora = LocalDateTime.now();
        if (personal.getBloqueadoHasta() != null && ahora.isBefore(personal.getBloqueadoHasta())) {
            throw new CuentaBloqueadaException(mensajeBloqueo(ahora, personal.getBloqueadoHasta()));
        }

        if (!passwordEncoder.matches(request.getPassword(), personal.getPasswordHash())) {
            int intentos = (personal.getIntentosFallidos() == null ? 0 : personal.getIntentosFallidos()) + 1;
            if (intentos >= MAX_INTENTOS) {
                personal.setIntentosFallidos(0);
                personal.setBloqueadoHasta(ahora.plusMinutes(MINUTOS_BLOQUEO));
                personalRepository.save(personal);
                throw new CuentaBloqueadaException(
                        "Cuenta bloqueada por " + MINUTOS_BLOQUEO + " minutos tras "
                                + MAX_INTENTOS + " intentos fallidos. Si no recuerdas tu contraseña, "
                                + "pide al administrador que te asigne una nueva.");
            }
            personal.setIntentosFallidos(intentos);
            personalRepository.save(personal);
            throw new BadCredentialsException("Usuario o contraseña incorrectos");
        }

        // Login correcto: el contador vuelve a cero para que fallos aislados de
        // días distintos no terminen bloqueando la cuenta.
        if ((personal.getIntentosFallidos() != null && personal.getIntentosFallidos() > 0)
                || personal.getBloqueadoHasta() != null) {
            personal.setIntentosFallidos(0);
            personal.setBloqueadoHasta(null);
            personalRepository.save(personal);
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

    // --- AQUI ESTA EL METODO CORREGIDO ---
    @Override
    @Transactional
    public void cambiarPassword(CambiarPasswordRequest request) {
        // Usamos findByUsuarioAndActivoTrue porque en el registro el usuario es igual al correo
        Cliente cliente = clienteRepository.findByUsuarioAndActivoTrue(request.getCorreo())
                .orElseThrow(() -> new BusinessException("El correo no está registrado."));

        cliente.setPasswordHash(passwordEncoder.encode(request.getNuevaPassword()));
        clienteRepository.save(cliente);
    }
    @Override
    @Transactional
    public void cambiarPasswordPersonal(CambiarPasswordPersonalRequest request) {
        // Buscamos al empleado/gerente solo por su usuario
        Personal personal = personalRepository.findByUsuarioAndActivoTrue(request.getUsuario())
                .orElseThrow(() -> new BusinessException("El usuario no existe o está inactivo."));

        // Encriptamos la nueva contraseña y la guardamos
        personal.setPasswordHash(passwordEncoder.encode(request.getNuevaPassword()));
        personalRepository.save(personal);
    }



    private static String mensajeBloqueo(LocalDateTime ahora, LocalDateTime hasta) {
        long minutos = Math.max(1, Duration.between(ahora, hasta).toMinutes() + 1);
        return "Cuenta bloqueada temporalmente por intentos fallidos. Vuelve a intentarlo en "
                + minutos + (minutos == 1 ? " minuto." : " minutos.");
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
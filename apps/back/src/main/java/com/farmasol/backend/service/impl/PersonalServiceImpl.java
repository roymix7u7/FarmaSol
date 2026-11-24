package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.personal.PersonalRequest;
import com.farmasol.backend.dto.personal.PersonalResponse;
import com.farmasol.backend.exception.BusinessException;
import com.farmasol.backend.exception.ResourceNotFoundException;
import com.farmasol.backend.model.Personal;
import com.farmasol.backend.repository.PersonalRepository;
import com.farmasol.backend.service.PersonalService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonalServiceImpl implements PersonalService {

    private final PersonalRepository personalRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<PersonalResponse> listar() {
        return personalRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PersonalResponse obtenerPorId(Long id) {
        return toResponse(buscar(id));
    }

    @Override
    @Transactional
    public PersonalResponse crear(PersonalRequest request, Long idGerenteCreador) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BusinessException("La contraseña es obligatoria al crear una cuenta");
        }
        if (personalRepository.existsByUsuario(request.getUsuario())) {
            throw new BusinessException("El usuario ya existe");
        }
        if (personalRepository.existsByCorreo(request.getCorreo())) {
            throw new BusinessException("El correo ya está registrado");
        }

        Personal creador = personalRepository.findById(idGerenteCreador).orElse(null);

        Personal personal = Personal.builder()
                .nombres(request.getNombres())
                .apellidos(request.getApellidos())
                .usuario(request.getUsuario())
                .correo(request.getCorreo())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .rol(request.getRol())
                .creadoPor(creador)
                .activo(true)
                .build();

        return toResponse(personalRepository.save(personal));
    }

    @Override
    @Transactional
    public PersonalResponse actualizar(Long id, PersonalRequest request) {
        Personal personal = buscar(id);

        personalRepository.findByUsuario(request.getUsuario())
                .filter(p -> !p.getId().equals(id))
                .ifPresent(p -> { throw new BusinessException("El usuario ya existe"); });
        personalRepository.findByCorreo(request.getCorreo())
                .filter(p -> !p.getId().equals(id))
                .ifPresent(p -> { throw new BusinessException("El correo ya está registrado"); });

        personal.setNombres(request.getNombres());
        personal.setApellidos(request.getApellidos());
        personal.setUsuario(request.getUsuario());
        personal.setCorreo(request.getCorreo());
        personal.setRol(request.getRol());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            personal.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        return toResponse(personalRepository.save(personal));
    }

    @Override
    @Transactional
    public void cambiarEstado(Long id, boolean activo) {
        Personal personal = buscar(id);
        personal.setActivo(activo);
        personalRepository.save(personal);
    }

    private Personal buscar(Long id) {
        return personalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Personal no encontrado con ID: " + id));
    }

    private PersonalResponse toResponse(Personal p) {
        return PersonalResponse.builder()
                .id(p.getId())
                .nombres(p.getNombres())
                .apellidos(p.getApellidos())
                .usuario(p.getUsuario())
                .correo(p.getCorreo())
                .rol(p.getRol())
                .activo(p.getActivo())
                .creadoPorUsuario(p.getCreadoPor() != null ? p.getCreadoPor().getUsuario() : null)
                .fechaCreacion(p.getFechaCreacion())
                .build();
    }
}

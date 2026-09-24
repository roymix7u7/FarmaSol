package com.farmasol.backend.service;

import com.farmasol.backend.dto.personal.PersonalRequest;
import com.farmasol.backend.dto.personal.PersonalResponse;

import java.util.List;

public interface PersonalService {

    List<PersonalResponse> listar();

    PersonalResponse obtenerPorId(Long id);

    /** Crea la cuenta; {@code idGerenteCreador} queda como {@code creado_por}. */
    PersonalResponse crear(PersonalRequest request, Long idGerenteCreador);

    PersonalResponse actualizar(Long id, PersonalRequest request);

    void cambiarEstado(Long id, boolean activo);
}

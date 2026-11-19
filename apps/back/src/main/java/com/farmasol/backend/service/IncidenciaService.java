package com.farmasol.backend.service;

import com.farmasol.backend.dto.incidencia.IncidenciaRequest;
import com.farmasol.backend.dto.incidencia.IncidenciaResponse;
import com.farmasol.backend.dto.incidencia.ResolverIncidenciaRequest;
import com.farmasol.backend.model.enums.EstadoIncidencia;

import java.util.List;

public interface IncidenciaService {

    /** El trabajador conectado reporta un problema. */
    IncidenciaResponse reportar(IncidenciaRequest request);

    /** Lo que reportó el trabajador conectado, del más nuevo al más viejo. */
    List<IncidenciaResponse> misReportes();

    /** Todos (para el gerente); con estado, solo los de ese estado. */
    List<IncidenciaResponse> listar(EstadoIncidencia estado);

    IncidenciaResponse resolver(Long id, ResolverIncidenciaRequest request);
}

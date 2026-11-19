package com.farmasol.backend.dto.incidencia;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResolverIncidenciaRequest {

    /** Opcional: lo que el gerente hizo o le contesta al trabajador. */
    @Size(max = 500, message = "La respuesta no puede pasar de 500 caracteres")
    private String respuesta;
}

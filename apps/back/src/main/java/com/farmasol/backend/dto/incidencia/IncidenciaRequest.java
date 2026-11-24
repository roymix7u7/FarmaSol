package com.farmasol.backend.dto.incidencia;

import com.farmasol.backend.model.enums.TipoIncidencia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class IncidenciaRequest {

    @NotNull(message = "Elige el tipo de problema")
    private TipoIncidencia tipo;

    private Boolean urgente;

    @Size(max = 120, message = "La referencia no puede pasar de 120 caracteres")
    private String referencia;

    @NotBlank(message = "Describe el problema")
    @Size(min = 10, max = 500, message = "La descripción debe tener entre 10 y 500 caracteres")
    private String descripcion;
}

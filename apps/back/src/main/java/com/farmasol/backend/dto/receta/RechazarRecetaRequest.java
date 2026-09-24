package com.farmasol.backend.dto.receta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RechazarRecetaRequest {

    @NotBlank(message = "Debes indicar el motivo del rechazo")
    @Size(max = 255)
    private String motivo;
}

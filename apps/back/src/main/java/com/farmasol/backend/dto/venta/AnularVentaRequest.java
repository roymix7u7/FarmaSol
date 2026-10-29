package com.farmasol.backend.dto.venta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnularVentaRequest {

    @NotBlank(message = "Indica el motivo de la anulación")
    @Size(min = 10, max = 255, message = "El motivo debe tener entre 10 y 255 caracteres")
    private String motivo;
}

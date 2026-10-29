package com.farmasol.backend.dto.direccion;

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
public class DireccionRequest {

    @Size(max = 50)
    private String alias;

    @NotBlank(message = "La dirección es obligatoria")
    @Size(max = 255)
    private String direccion;

    @Size(max = 100)
    private String distrito;

    @Size(max = 100)
    private String ciudad;

    @Size(max = 255)
    private String referencia;

    @NotBlank(message = "Debe indicar quién recibe el paquete")
    @Size(max = 120)
    private String quienRecibe;

    @NotBlank(message = "El teléfono de contacto es obligatorio")
    @Size(max = 20)
    private String telefonoContacto;

    private Boolean esPredeterminada;
}

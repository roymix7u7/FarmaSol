package com.farmasol.backend.dto.direccion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DireccionResponse {

    private Long id;
    private String alias;
    private String direccion;
    private String distrito;
    private String ciudad;
    private String referencia;
    private String quienRecibe;
    private String telefonoContacto;
    private Boolean esPredeterminada;
}

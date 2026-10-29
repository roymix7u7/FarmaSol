package com.farmasol.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioAutenticadoDTO {

    private String tipo;
    private Long uid;
    private String usuario;
    private String rol;
    private String nombre;
}

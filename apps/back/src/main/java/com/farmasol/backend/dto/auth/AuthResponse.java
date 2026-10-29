package com.farmasol.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    /** PERSONAL o CLIENTE. */
    private String tipo;
    /** GERENTE, ADMINISTRADOR o CLIENTE. */
    private String rol;
    private Long uid;
    private String nombres;
}

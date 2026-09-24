package com.farmasol.backend.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Principal que queda en el {@code SecurityContext} tras validar el JWT.
 * Se reconstruye desde los claims del token, sin consultar la base de datos.
 */
@Getter
@AllArgsConstructor
public class UsuarioAutenticado {

    private final TipoUsuario tipo;
    private final Long uid;
    private final String usuario;
    /** GERENTE, ADMINISTRADOR o CLIENTE (sin el prefijo ROLE_). */
    private final String rol;
    private final String nombre;
}

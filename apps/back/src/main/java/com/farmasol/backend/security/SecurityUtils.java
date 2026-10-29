package com.farmasol.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Acceso al usuario autenticado de la petición actual.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static UsuarioAutenticado actual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UsuarioAutenticado u)) {
            throw new IllegalStateException("No hay usuario autenticado en el contexto");
        }
        return u;
    }

    public static Long getUidActual() {
        return actual().getUid();
    }

    public static String getUsuarioActual() {
        return actual().getUsuario();
    }

    public static boolean esPersonal() {
        return actual().getTipo() == TipoUsuario.PERSONAL;
    }
}

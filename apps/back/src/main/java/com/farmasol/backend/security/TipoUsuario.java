package com.farmasol.backend.security;

/**
 * Distingue el origen del usuario autenticado: personal interno (tabla {@code personal})
 * o cliente de la tienda (tabla {@code clientes}).
 */
public enum TipoUsuario {
    PERSONAL,
    CLIENTE
}

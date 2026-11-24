package com.farmasol.backend.exception;

/**
 * La cuenta del personal está bloqueada por intentos fallidos.
 *
 * <p>No extiende AuthenticationException a propósito: el manejador global
 * reescribe esas como "Usuario o contraseña incorrectos", y aquí el usuario
 * necesita saber que está bloqueado y por cuánto tiempo.
 */
public class CuentaBloqueadaException extends RuntimeException {

    public CuentaBloqueadaException(String mensaje) {
        super(mensaje);
    }
}

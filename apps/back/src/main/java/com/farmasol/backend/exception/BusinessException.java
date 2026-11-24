package com.farmasol.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Regla de negocio incumplida (stock insuficiente, transición de estado inválida,
 * slug duplicado, carrito vacío, etc.). Se mapea a HTTP 409.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class BusinessException extends RuntimeException {

    public BusinessException(String mensaje) {
        super(mensaje);
    }
}

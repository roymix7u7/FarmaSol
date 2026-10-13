package com.farmasol.backend.validation;

/**
 * Reglas de formato compartidas por los DTOs. Son constantes para poder usarlas
 * dentro de las anotaciones de validación, y viven en un solo sitio para que el
 * registro de clientes y el alta de personal no diverjan.
 */
public final class Reglas {

    private Reglas() {
    }

    /** Al menos 8 caracteres, con una mayúscula y un número. */
    public static final String PASSWORD = "^(?=.*[A-Z])(?=.*[0-9]).{8,100}$";
    public static final String PASSWORD_MENSAJE =
            "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número";

    /** Celular peruano: 9 dígitos y empieza en 9. */
    public static final String TELEFONO = "^9[0-9]{8}$";
    public static final String TELEFONO_MENSAJE =
            "El teléfono debe ser un celular de 9 dígitos que empiece con 9";
}

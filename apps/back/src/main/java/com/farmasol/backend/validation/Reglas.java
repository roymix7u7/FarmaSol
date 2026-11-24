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

    /**
     * Número de operación de Yape. Yape no publica un formato oficial, así que se
     * acepta un rango amplio (6 a 12 dígitos) que no rechace operaciones reales.
     * Si se confirma la longitud exacta, se ajusta aquí.
     */
    public static final String YAPE_OPERACION = "^[0-9]{6,12}$";
    public static final String YAPE_OPERACION_MENSAJE =
            "El número de operación de Yape debe tener entre 6 y 12 dígitos";

    /** Número de operación o referencia que imprime el voucher del POS. */
    public static final String VOUCHER = "^[0-9]{4,12}$";
    public static final String VOUCHER_MENSAJE =
            "El número de operación del voucher debe tener entre 4 y 12 dígitos";

    /**
     * Solo los 4 últimos dígitos de la tarjeta. Exactamente 4 a propósito: así es
     * imposible que en ese campo termine guardado un número de tarjeta completo.
     */
    public static final String ULTIMOS4 = "^[0-9]{4}$";
    public static final String ULTIMOS4_MENSAJE =
            "Escribe solo los 4 últimos dígitos de la tarjeta";

    /** Por encima de este total la boleta debe identificar al comprador (SUNAT). */
    public static final String UMBRAL_BOLETA_IDENTIFICADA = "700.00";
}

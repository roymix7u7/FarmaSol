package com.farmasol.backend.model.enums;

import java.util.regex.Pattern;

/**
 * Documento de identidad del cliente, con la regla de formato de cada uno.
 *
 * <p>Las longitudes siguen la tabla de tipos de documento de SUNAT: el DNI tiene
 * exactamente 8 dígitos y el carné de extranjería es alfanumérico de hasta 12
 * caracteres. SUNAT no fija un mínimo para el carné; se usa 9 porque es la
 * longitud habitual de los que emite Migraciones. Si aparece uno válido más
 * corto, basta con ajustar el patrón aquí.
 */
public enum TipoDocumento {

    DNI("DNI", Pattern.compile("^[0-9]{8}$"),
            "El DNI debe tener exactamente 8 dígitos"),

    CARNET_EXTRANJERIA("Carné de extranjería", Pattern.compile("^[A-Z0-9]{9,12}$"),
            "El carné de extranjería debe tener entre 9 y 12 caracteres, solo letras y números");

    private final String etiqueta;
    private final Pattern formato;
    private final String mensajeError;

    TipoDocumento(String etiqueta, Pattern formato, String mensajeError) {
        this.etiqueta = etiqueta;
        this.formato = formato;
        this.mensajeError = mensajeError;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    public String getMensajeError() {
        return mensajeError;
    }

    /** Quita espacios y pasa a mayúsculas: "ab 123456 789" y "AB123456789" son el mismo carné. */
    public String normalizar(String numero) {
        return numero == null ? null : numero.strip().replace(" ", "").toUpperCase();
    }

    public boolean esValido(String numero) {
        String n = normalizar(numero);
        return n != null && formato.matcher(n).matches();
    }
}

package com.farmasol.backend.model.enums;

/**
 * Forma de aplicar el descuento de una promoción.
 * <ul>
 *   <li>{@code PORCENTAJE}: {@code valorDescuento} es un % (20 = 20%).</li>
 *   <li>{@code MONTO}: {@code valorDescuento} es un monto fijo en soles.</li>
 * </ul>
 */
public enum TipoDescuento {
    PORCENTAJE,
    MONTO
}

package com.farmasol.backend.model.enums;

/**
 * Rol del personal interno.
 * <ul>
 *   <li>{@code GERENTE}: acceso total, incluida la gestión de cuentas de personal y promociones.</li>
 *   <li>{@code EMPLEADO}: gestiona catálogo y pedidos, ve reportes; no gestiona personal ni promociones.</li>
 * </ul>
 */
public enum RolPersonal {
    GERENTE,
    EMPLEADO
}
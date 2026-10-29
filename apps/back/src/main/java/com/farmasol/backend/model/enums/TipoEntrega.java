package com.farmasol.backend.model.enums;

/**
 * Forma en que el cliente recibe el pedido.
 * <ul>
 *   <li>{@code DELIVERY}: envío a domicilio (usa una dirección + datos de envío).</li>
 *   <li>{@code RECOJO_TIENDA}: retiro en una sede de FarmaSol (usa sede + quién retira + DNI).</li>
 * </ul>
 */
public enum TipoEntrega {
    DELIVERY,
    RECOJO_TIENDA
}

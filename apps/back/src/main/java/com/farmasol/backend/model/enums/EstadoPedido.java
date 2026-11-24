package com.farmasol.backend.model.enums;

import java.util.Set;

/**
 * Estados del ciclo de vida de un pedido y sus transiciones permitidas.
 */
public enum EstadoPedido {
    PENDIENTE,
    CONFIRMADO,
    EN_CAMINO,
    ENTREGADO,
    CANCELADO;

    private static final java.util.Map<EstadoPedido, Set<EstadoPedido>> TRANSICIONES = java.util.Map.of(
            PENDIENTE, Set.of(CONFIRMADO, CANCELADO),
            CONFIRMADO, Set.of(EN_CAMINO, CANCELADO),
            EN_CAMINO, Set.of(ENTREGADO, CANCELADO),
            ENTREGADO, Set.of(),
            CANCELADO, Set.of()
    );

    public boolean puedeTransicionarA(EstadoPedido destino) {
        return TRANSICIONES.getOrDefault(this, Set.of()).contains(destino);
    }
}

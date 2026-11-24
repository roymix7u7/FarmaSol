package com.farmasol.backend.service;

import com.farmasol.backend.dto.producto.PrecioCalculadoDTO;
import com.farmasol.backend.model.Producto;

import java.util.Collection;
import java.util.Map;

public interface PrecioService {

    /** Calcula el precio final del producto aplicando la mejor promoción vigente. */
    PrecioCalculadoDTO calcular(Producto producto);

    /**
     * Calcula el precio de varios productos con un número fijo de consultas.
     *
     * <p>Usa esto siempre que tengas una lista: llamar a {@link #calcular(Producto)}
     * dentro de un bucle dispara varias consultas por producto (N+1).
     *
     * @return precios indexados por id de producto
     */
    Map<Long, PrecioCalculadoDTO> calcular(Collection<Producto> productos);
}

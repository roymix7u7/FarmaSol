package com.farmasol.backend.service;

import com.farmasol.backend.dto.producto.PrecioCalculadoDTO;
import com.farmasol.backend.model.Producto;

public interface PrecioService {

    /** Calcula el precio final del producto aplicando la mejor promoción vigente. */
    PrecioCalculadoDTO calcular(Producto producto);
}

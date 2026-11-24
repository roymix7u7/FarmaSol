package com.farmasol.backend.service;

import com.farmasol.backend.dto.carrito.AgregarItemRequest;
import com.farmasol.backend.dto.carrito.CarritoResponse;

public interface CarritoService {

    CarritoResponse verCarrito(Long idCliente);

    CarritoResponse agregarItem(Long idCliente, AgregarItemRequest request);

    CarritoResponse actualizarCantidad(Long idCliente, Long idProducto, int cantidad);

    CarritoResponse eliminarItem(Long idCliente, Long idProducto);

    void vaciar(Long idCliente);
}

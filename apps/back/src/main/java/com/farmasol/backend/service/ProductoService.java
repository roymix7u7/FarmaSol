package com.farmasol.backend.service;

import com.farmasol.backend.dto.ProductoDTO;
import com.farmasol.backend.dto.producto.ProductoResponse;

import java.util.List;

public interface ProductoService {

    List<ProductoResponse> listar(String busqueda, Long idCategoria, boolean incluirSubcategorias, boolean soloActivos);

    ProductoResponse obtenerPorId(Long id);

    ProductoResponse guardar(ProductoDTO productoDTO);

    ProductoResponse actualizar(Long id, ProductoDTO productoDTO);

    /** Baja lógica ({@code activo = false}). */
    void eliminar(Long id);
}

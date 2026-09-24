package com.farmasol.backend.service;

import com.farmasol.backend.dto.categoria.CategoriaRequest;
import com.farmasol.backend.dto.categoria.CategoriaResponse;

import java.util.List;

public interface CategoriaService {

    /** Categorías raíz activas con sus subcategorías anidadas. */
    List<CategoriaResponse> listarArbol();

    List<CategoriaResponse> listarPlano();

    CategoriaResponse obtenerPorId(Long id);

    CategoriaResponse crear(CategoriaRequest request);

    CategoriaResponse actualizar(Long id, CategoriaRequest request);

    void desactivar(Long id);

    /** IDs de la categoría y sus descendientes. */
    List<Long> idsSubarbol(Long id);

    /** IDs de la categoría y sus ancestros. */
    List<Long> idsAncestros(Long id);
}

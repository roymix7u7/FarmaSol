package com.farmasol.backend.dto.categoria;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoriaResponse {

    private Long id;
    private String nombre;
    private String slug;
    private Long idCategoriaPadre;
    private String nombrePadre;
    private String descripcion;
    private String imagenUrl;
    private Integer orden;
    private Boolean activo;
    /** Subcategorías directas; solo se llena en la vista de árbol. */
    private List<CategoriaResponse> subcategorias;
}

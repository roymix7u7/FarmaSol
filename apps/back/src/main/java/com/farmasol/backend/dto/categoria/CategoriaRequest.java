package com.farmasol.backend.dto.categoria;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoriaRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 80)
    private String nombre;

    /** Opcional: si no viene se genera desde el nombre. */
    @Size(max = 100)
    private String slug;

    /** Nulo para categoría raíz. */
    private Long idCategoriaPadre;

    @Size(max = 255)
    private String descripcion;

    @Size(max = 255)
    private String imagenUrl;

    @PositiveOrZero(message = "El orden no puede ser negativo")
    private Integer orden;
}

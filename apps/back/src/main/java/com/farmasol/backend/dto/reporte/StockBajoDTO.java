package com.farmasol.backend.dto.reporte;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockBajoDTO {

    private Long idProducto;
    private String nombre;
    private String categoria;
    private Integer stock;
}

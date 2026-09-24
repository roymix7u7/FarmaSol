package com.farmasol.backend.dto.producto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoResponse {

    private Long id;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private BigDecimal precioFinal;
    private BigDecimal descuentoUnitario;
    private Long idPromocionAplicada;
    private Integer stock;
    private Long idCategoria;
    private String nombreCategoria;
    private String imagenUrl;
    private Boolean requiereReceta;
    private String marca;
    private String presentacion;
    private String registroSanitario;
    private Boolean activo;
}

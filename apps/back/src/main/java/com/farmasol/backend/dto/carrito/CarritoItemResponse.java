package com.farmasol.backend.dto.carrito;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarritoItemResponse {

    private Long idProducto;
    private String nombre;
    private String imagenUrl;
    private BigDecimal precioUnitario;
    private BigDecimal precioFinal;
    private BigDecimal descuentoUnitario;
    private Integer cantidad;
    private BigDecimal subtotal;
    private Integer stockDisponible;
}

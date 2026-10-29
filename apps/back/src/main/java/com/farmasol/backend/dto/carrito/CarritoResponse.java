package com.farmasol.backend.dto.carrito;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarritoResponse {

    private Long idCarrito;
    private List<CarritoItemResponse> items;
    private Integer cantidadItems;
    private BigDecimal subtotal;
    private BigDecimal descuentoTotal;
    private BigDecimal total;
}

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
public class PrecioCalculadoDTO {

    private BigDecimal precioBase;
    private BigDecimal descuentoUnitario;
    private BigDecimal precioFinal;
    private Long idPromocionAplicada;
}

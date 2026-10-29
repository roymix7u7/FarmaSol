package com.farmasol.backend.dto.reporte;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VentasPorPeriodoDTO {

    private LocalDate dia;
    /** Operaciones del día: pedidos web más ventas en tienda. */
    private long cantidadPedidos;
    /** Total del día: web más tienda. */
    private BigDecimal monto;
    /** Parte de lo anterior que se vendió en el mostrador. */
    private long cantidadPresencial;
    private BigDecimal montoPresencial;
}

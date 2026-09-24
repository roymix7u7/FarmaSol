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
    private long cantidadPedidos;
    private BigDecimal monto;
}

package com.farmasol.backend.dto.reporte;

import com.farmasol.backend.model.enums.EstadoPedido;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidosPorEstadoDTO {

    private EstadoPedido estado;
    private long cantidad;
    private BigDecimal monto;
}

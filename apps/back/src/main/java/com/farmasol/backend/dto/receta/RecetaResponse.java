package com.farmasol.backend.dto.receta;

import com.farmasol.backend.model.enums.EstadoReceta;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecetaResponse {

    private Long id;
    private Long idPedido;
    private String codigoPedido;
    private Long idPedidoDetalle;
    private String nombreProducto;
    private Integer cantidad;
    private String nombreCliente;
    private EstadoReceta estado;
    private String motivoRechazo;
    private String revisadoPor;
    private LocalDateTime fechaSubida;
    private LocalDateTime fechaRevision;
}

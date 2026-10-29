package com.farmasol.backend.dto.pedido;

import com.farmasol.backend.model.enums.EstadoReceta;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoDetalleResponse {

    private Long idPedidoDetalle;
    private Long idProducto;
    private String nombreProducto;
    private BigDecimal precioUnitario;
    private BigDecimal descuentoUnitario;
    private Integer cantidad;
    private BigDecimal subtotal;
    private Boolean requiereReceta;
    /** Estado de la receta más reciente subida para esta línea (null si aún no se sube ninguna). */
    private EstadoReceta estadoReceta;
    private Long idRecetaVigente;
}

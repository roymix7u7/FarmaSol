package com.farmasol.backend.dto.pedido;

import com.farmasol.backend.model.enums.EstadoPedido;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoResumenResponse {

    private Long id;
    private String codigoPedido;
    private String nombreCliente;
    private EstadoPedido estado;
    private Boolean requiereReceta;
    private BigDecimal total;
    private Integer cantidadItems;
    /** Qué se compró, para mostrarlo en la lista sin abrir cada pedido. */
    private List<ProductoResumen> productos;
    private LocalDateTime fechaPedido;

    public record ProductoResumen(String nombreProducto, Integer cantidad, BigDecimal subtotal,
                                  Boolean requiereReceta) { }
}

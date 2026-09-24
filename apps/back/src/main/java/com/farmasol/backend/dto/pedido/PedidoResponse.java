package com.farmasol.backend.dto.pedido;

import com.farmasol.backend.model.enums.EstadoPedido;
import com.farmasol.backend.model.enums.TipoEntrega;
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
public class PedidoResponse {

    private Long id;
    private String codigoPedido;
    private Long idCliente;
    private String nombreCliente;
    private EstadoPedido estado;
    private TipoEntrega tipoEntrega;
    private Boolean requiereReceta;
    private BigDecimal subtotal;
    private BigDecimal descuentoTotal;
    private BigDecimal costoEnvio;
    private BigDecimal total;
    private String envioQuienRecibe;
    private String envioTelefono;
    private String envioDireccion;
    private String envioDistrito;
    private String envioReferencia;
    private String recojoSede;
    private String recojoNombre;
    private String recojoDni;
    private LocalDateTime fechaPedido;
    private LocalDateTime fechaConfirmacion;
    private LocalDateTime fechaEntrega;
    private String atendidoPor;
    private String notas;
    private List<PedidoDetalleResponse> detalles;
}

package com.farmasol.backend.dto.venta;

import com.farmasol.backend.model.enums.MarcaTarjeta;
import com.farmasol.backend.model.enums.MetodoPago;
import com.farmasol.backend.model.enums.TipoDocumento;
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
public class VentaResponse {

    private Long id;
    private String codigoVenta;
    private LocalDateTime fechaVenta;
    private Long idVendedor;
    private String vendidoPor;

    private TipoDocumento clienteTipoDocumento;
    private String clienteDocumento;
    private String clienteNombre;

    private List<Linea> detalles;
    private int cantidadItems;
    private BigDecimal subtotal;
    private BigDecimal descuentoTotal;
    private BigDecimal total;

    private MetodoPago metodoPago;
    private BigDecimal montoRecibido;
    private BigDecimal vuelto;
    private String codigoOperacion;
    private MarcaTarjeta tarjetaMarca;
    private String tarjetaUltimos4;

    private boolean anulada;
    private String anuladaPor;
    private LocalDateTime fechaAnulacion;
    private String motivoAnulacion;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Linea {
        private Long idProducto;
        private String nombreProducto;
        private BigDecimal precioUnitario;
        private BigDecimal descuentoUnitario;
        private Integer cantidad;
        private BigDecimal subtotal;
        private boolean requiereReceta;
        private boolean recetaVerificada;
    }
}

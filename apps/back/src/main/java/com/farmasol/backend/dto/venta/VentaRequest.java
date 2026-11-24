package com.farmasol.backend.dto.venta;

import com.farmasol.backend.model.enums.MarcaTarjeta;
import com.farmasol.backend.model.enums.MetodoPago;
import com.farmasol.backend.model.enums.TipoDocumento;
import com.farmasol.backend.validation.PagoValido;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Venta presencial. Aquí solo va lo que escribe el cajero: los precios, los
 * descuentos y el vuelto los calcula el servidor, nunca se aceptan del cliente.
 */
@PagoValido
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VentaRequest {

    @NotEmpty(message = "La venta no tiene productos")
    @Size(max = 50, message = "Una venta admite como máximo 50 productos distintos")
    @Valid
    private List<Item> items;

    @NotNull(message = "Elige el método de pago")
    private MetodoPago metodoPago;

    /** Solo en efectivo: lo que entregó el cliente. */
    @DecimalMax(value = "99999.99", message = "El monto recibido es demasiado alto")
    @Digits(integer = 5, fraction = 2, message = "El monto recibido admite como máximo 2 decimales")
    private BigDecimal montoRecibido;

    /** Yape: número de operación. Tarjeta: número de operación del voucher. */
    private String codigoOperacion;

    private MarcaTarjeta tarjetaMarca;

    private String tarjetaUltimos4;

    /** Opcional; obligatorio si el total supera S/ 700. */
    @Valid
    private Comprador cliente;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Item {

        @NotNull(message = "Falta el producto")
        private Long idProducto;

        @NotNull(message = "Falta la cantidad")
        @Min(value = 1, message = "La cantidad mínima es 1")
        @Max(value = 999, message = "La cantidad máxima por producto es 999")
        private Integer cantidad;

        /** Obligatorio en los productos con receta: el cajero confirma que la vio. */
        private boolean recetaVerificada;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Comprador {

        private TipoDocumento tipoDocumento;

        private String documento;

        @Size(max = 120, message = "El nombre es demasiado largo")
        private String nombre;
    }
}

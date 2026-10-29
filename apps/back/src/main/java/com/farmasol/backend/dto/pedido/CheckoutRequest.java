package com.farmasol.backend.dto.pedido;

import com.farmasol.backend.model.enums.TipoEntrega;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {

    @NotNull(message = "Debe elegir cómo recibir el pedido")
    private TipoEntrega tipoEntrega;

    /** Requerido si tipoEntrega = DELIVERY. */
    private Long idDireccion;

    /** Requeridos si tipoEntrega = RECOJO_TIENDA. */
    private Long idSede;
    @Size(max = 120)
    private String recojoNombre;
    @Size(max = 20)
    private String recojoDni;

    @Size(max = 255)
    private String notas;

    // --- NUEVOS CAMPOS DE PAGO (YAPE / VISA) ---
    @NotNull(message = "Debe seleccionar un método de pago")
    private String metodoPago; // "YAPE" o "VISA"

    private String subMetodoYape; // "QR" o "CODIGO"

    @Size(max = 15)
    private String yapeCelular;

    @Size(max = 30)
    private String yapeCodigoOperacion;

    @AssertTrue(message = "Para envío a domicilio debes elegir una dirección")
    public boolean isDeliveryValido() {
        return tipoEntrega != TipoEntrega.DELIVERY || idDireccion != null;
    }

    @AssertTrue(message = "Para retiro en botica debes indicar sede, nombre y DNI de quien retira")
    public boolean isRecojoValido() {
        return tipoEntrega != TipoEntrega.RECOJO_TIENDA
                || (idSede != null && recojoNombre != null && !recojoNombre.isBlank()
                    && recojoDni != null && !recojoDni.isBlank());
    }

    @AssertTrue(message = "Debe ingresar el celular y el código de aprobación de Yape")
    public boolean isYapeValido() {
        if (!"YAPE".equals(metodoPago)) return true;
        if ("CODIGO".equals(subMetodoYape)) {
            return yapeCelular != null && !yapeCelular.isBlank() 
                && yapeCodigoOperacion != null && !yapeCodigoOperacion.isBlank();
        }
        return true; // Si es QR no exige campos extra
    }
}
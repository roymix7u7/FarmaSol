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
}

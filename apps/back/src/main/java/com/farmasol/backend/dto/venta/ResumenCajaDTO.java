package com.farmasol.backend.dto.venta;

import com.farmasol.backend.model.enums.MetodoPago;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/**
 * Cuadre de caja de un día. "efectivoEnCaja" es lo que debería haber en el cajón
 * por las ventas: el total cobrado en efectivo, ya descontado el vuelto.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumenCajaDTO {

    private LocalDate fecha;
    /** true si es la caja de todo el personal (gerente); false si es solo la propia. */
    private boolean todoElPersonal;
    private long cantidadVentas;
    private BigDecimal totalVendido;
    private BigDecimal efectivoEnCaja;
    private Map<MetodoPago, BigDecimal> totalPorMetodo;
    private Map<MetodoPago, Long> cantidadPorMetodo;
    private long cantidadAnuladas;
    private BigDecimal montoAnulado;
}

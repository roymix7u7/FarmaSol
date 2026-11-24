package com.farmasol.backend.service;

import com.farmasol.backend.dto.venta.ResumenCajaDTO;
import com.farmasol.backend.dto.venta.VentaRequest;
import com.farmasol.backend.dto.venta.VentaResponse;

import java.time.LocalDate;
import java.util.List;

/** Ventas presenciales: las que cobra el personal en el mostrador. */
public interface VentaService {

    /** Registra la venta, descuenta el stock y devuelve el comprobante. */
    VentaResponse registrar(VentaRequest request);

    /** Ventas de un día. El gerente ve todas; el empleado, solo las suyas. */
    List<VentaResponse> listarDelDia(LocalDate fecha);

    /** Cuadre de caja del día, con el mismo criterio de visibilidad que listarDelDia. */
    ResumenCajaDTO resumenCaja(LocalDate fecha);

    VentaResponse obtener(Long id);

    /** Anula la venta y devuelve el stock. Solo el gerente. */
    VentaResponse anular(Long id, String motivo);
}

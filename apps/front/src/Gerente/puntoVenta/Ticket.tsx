import { etiquetaMarca, etiquetaMetodo, soles, type Venta } from '../../api/ventas';
import { infoDocumento } from '../../shared/validaciones';

function fechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Comprobante de la venta. Es un ticket interno, no una boleta electrónica: esa
 * la emite SUNAT a través de un proveedor autorizado, y aquí no hay integración.
 */
export function Ticket({ venta }: { venta: Venta }) {
  return (
    <div className="ticket" aria-label={`Ticket de la venta ${venta.codigoVenta}`}>
      {venta.anulada && <div className="ticket-anulada">VENTA ANULADA</div>}

      <div className="ticket-centro">
        <div className="ticket-marca">FarmaSOL</div>
        <div>Farmacia y Botica</div>
        <div>Comprobante de venta</div>
      </div>
      <hr />

      <div className="ticket-fila">
        <span>N°</span>
        <span>{venta.codigoVenta}</span>
      </div>
      <div className="ticket-fila">
        <span>Fecha</span>
        <span>{fechaHora(venta.fechaVenta)}</span>
      </div>
      <div className="ticket-fila">
        <span>Atendió</span>
        <span>{venta.vendidoPor}</span>
      </div>

      {venta.clienteNombre && (
        <>
          <hr />
          <div>Cliente: {venta.clienteNombre}</div>
          <div>
            {infoDocumento(venta.clienteTipoDocumento ?? 'DNI').etiqueta}: {venta.clienteDocumento}
          </div>
        </>
      )}
      <hr />

      {venta.detalles.map((d, i) => (
        <div key={i} className="ticket-item">
          <div>
            {d.nombreProducto}
            {d.requiereReceta && ' (Rx)'}
          </div>
          <div className="ticket-fila">
            <span>
              {d.cantidad} x {soles(d.precioUnitario - d.descuentoUnitario)}
            </span>
            <span>{soles(d.subtotal)}</span>
          </div>
        </div>
      ))}
      <hr />

      <div className="ticket-fila">
        <span>Subtotal</span>
        <span>{soles(venta.subtotal)}</span>
      </div>
      {venta.descuentoTotal > 0 && (
        <div className="ticket-fila">
          <span>Descuentos</span>
          <span>-{soles(venta.descuentoTotal)}</span>
        </div>
      )}
      <div className="ticket-fila ticket-total">
        <span>TOTAL</span>
        <span>{soles(venta.total)}</span>
      </div>
      <hr />

      <div className="ticket-fila">
        <span>Pago</span>
        <span>{etiquetaMetodo(venta.metodoPago)}</span>
      </div>
      {venta.metodoPago === 'EFECTIVO' && (
        <>
          <div className="ticket-fila">
            <span>Recibido</span>
            <span>{soles(venta.montoRecibido)}</span>
          </div>
          <div className="ticket-fila">
            <span>Vuelto</span>
            <span>{soles(venta.vuelto)}</span>
          </div>
        </>
      )}
      {venta.metodoPago === 'YAPE' && (
        <div className="ticket-fila">
          <span>N° operación</span>
          <span>{venta.codigoOperacion}</span>
        </div>
      )}
      {venta.metodoPago === 'TARJETA' && (
        <>
          <div className="ticket-fila">
            <span>Tarjeta</span>
            <span>
              {etiquetaMarca(venta.tarjetaMarca)} **** {venta.tarjetaUltimos4}
            </span>
          </div>
          <div className="ticket-fila">
            <span>N° operación</span>
            <span>{venta.codigoOperacion}</span>
          </div>
        </>
      )}

      {venta.anulada && (
        <>
          <hr />
          <div>Anulada por {venta.anuladaPor}</div>
          <div>Motivo: {venta.motivoAnulacion}</div>
        </>
      )}

      <hr />
      <div className="ticket-centro">
        <div>¡Gracias por su compra!</div>
        <div style={{ fontSize: 11 }}>Conserve este comprobante</div>
      </div>
    </div>
  );
}

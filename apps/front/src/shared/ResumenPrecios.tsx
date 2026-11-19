import '../Css/Tienda.css';

/**
 * Cómo se muestran los precios cuando hay promociones, igual en el carrito, el
 * pago y "Mis pedidos":
 *
 *   Precio regular (3 productos)      S/ 50.00
 *   Descuento por promociones       − S/  7.50
 *   Recojo en tienda                    Gratis
 *   ─────────────────────────────────────────
 *   Total a pagar                     S/ 42.50
 *
 * Antes el carrito mostraba "Subtotal" con el descuento ya aplicado y además le
 * restaba el descuento: la cuenta no cuadraba a la vista.
 */

export interface LineaPrecio {
  /** Precio normal de una unidad, sin promoción. */
  precioRegular: number;
  /** Cuánto se descuenta por unidad (0 si no hay promoción). */
  descuentoUnitario: number;
  cantidad: number;
}

export interface Desglose {
  unidades: number;
  regular: number;
  descuento: number;
  envio: number;
  total: number;
  /** Porcentaje ahorrado sobre el precio regular, redondeado. */
  porcentaje: number;
}

const dinero = (n: number) => `S/ ${n.toFixed(2)}`;
const redondear = (n: number) => Math.round(n * 100) / 100;

/**
 * Suma las líneas. El total es el que manda el servidor; el descuento se saca
 * como regular − total (más envío), para que la resta que ve el cliente cuadre
 * al céntimo aunque el redondeo por línea difiera.
 */
export function desglosar(lineas: LineaPrecio[], total: number, envio = 0): Desglose {
  const regular = redondear(lineas.reduce((t, l) => t + l.precioRegular * l.cantidad, 0));
  const descuento = Math.max(0, redondear(regular + envio - total));
  return {
    unidades: lineas.reduce((t, l) => t + l.cantidad, 0),
    regular,
    descuento,
    envio,
    total,
    porcentaje: regular > 0 ? Math.round((descuento / regular) * 100) : 0,
  };
}

/** Celda de precio unitario: precio final y, si hay promoción, el normal tachado y el %. */
export function PrecioUnitario({ linea, enLinea = false }: { linea: LineaPrecio; enLinea?: boolean }) {
  const final = linea.precioRegular - linea.descuentoUnitario;
  if (linea.descuentoUnitario <= 0) {
    return <span className="precio-linea">{dinero(linea.precioRegular)}</span>;
  }
  const pct = Math.round((linea.descuentoUnitario / linea.precioRegular) * 100);
  return (
    <span className={`precio-linea con-promo${enLinea ? ' en-linea' : ''}`}>
      <span className="precio-linea-final">{dinero(final)}</span>
      <span className="precio-linea-antes">
        <s>{dinero(linea.precioRegular)}</s>
        <span className="precio-linea-pct">-{pct}%</span>
      </span>
    </span>
  );
}

/** Celda de subtotal de una línea, con lo que se ahorra en ella. */
export function SubtotalLinea({ linea, subtotal }: { linea: LineaPrecio; subtotal: number }) {
  const ahorro = linea.descuentoUnitario * linea.cantidad;
  return (
    <span className="precio-linea">
      <span className="precio-linea-final">{dinero(subtotal)}</span>
      {ahorro > 0 && <span className="precio-linea-ahorro">Ahorras {dinero(ahorro)}</span>}
    </span>
  );
}

interface ResumenProps {
  desglose: Desglose;
  /** Texto de la fila de entrega; sin él no se muestra. */
  entrega?: string;
  etiquetaTotal?: string;
  nota?: string;
  /** Compra ya hecha: "Ahorraste" en vez de "Ahorras". */
  pagado?: boolean;
}

/** Bloque de totales para la columna lateral del carrito, del pago y del detalle de un pedido. */
export function ResumenPrecios({
  desglose,
  entrega,
  etiquetaTotal = 'Total a pagar',
  nota,
  pagado = false,
}: ResumenProps) {
  const { unidades, regular, descuento, envio, total, porcentaje } = desglose;
  const hayPromo = descuento > 0;
  return (
    <div className="resumen-precios">
      <div className="resumen-fila">
        <span>
          {hayPromo ? 'Precio regular' : 'Subtotal'}{' '}
          <span className="resumen-suave">
            ({unidades} {unidades === 1 ? 'producto' : 'productos'})
          </span>
        </span>
        <span>{dinero(regular)}</span>
      </div>

      {hayPromo && (
        <div className="resumen-fila es-descuento">
          <span>
            <i className="fa-solid fa-tag" aria-hidden></i> Descuento por promociones
          </span>
          <span>− {dinero(descuento)}</span>
        </div>
      )}

      {entrega && (
        <div className="resumen-fila">
          <span>{entrega}</span>
          <span className={envio === 0 ? 'resumen-gratis' : undefined}>
            {envio === 0 ? 'Gratis' : dinero(envio)}
          </span>
        </div>
      )}

      <div className="resumen-total">
        <span>{etiquetaTotal}</span>
        <span>{dinero(total)}</span>
      </div>

      {hayPromo && (
        <div className="resumen-ahorro" role="note">
          <i className="fa-solid fa-piggy-bank" aria-hidden></i>
          <span>
            {pagado ? 'Ahorraste' : 'Ahorras'} <strong>{dinero(descuento)}</strong> ({porcentaje}%)
            {pagado ? ' con las promociones de esta compra' : ' con las promociones vigentes'}
          </span>
        </div>
      )}

      {nota && <p className="resumen-nota">{nota}</p>}
    </div>
  );
}

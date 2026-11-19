import type { Producto } from '../types';
import '../Css/Tienda.css';

interface Props {
  producto: Producto;
  onAgregar: (producto: Producto) => void;
}

function estadoStock(stock: number) {
  if (stock === 0) return { texto: 'Agotado', clase: 'es-agotado' };
  if (stock < 10) return { texto: `¡Solo quedan ${stock}!`, clase: 'es-poco' };
  return { texto: 'Disponible', clase: 'es-ok' };
}

/** Tarjeta de producto del catálogo. La comparten el inicio, las categorías y la búsqueda. */
export function TarjetaProducto({ producto, onAgregar }: Props) {
  const stock = estadoStock(producto.stock);
  const tieneDescuento = producto.descuentoUnitario > 0;
  const porcentaje =
    tieneDescuento && producto.precio > 0
      ? Math.round((producto.descuentoUnitario / producto.precio) * 100)
      : 0;
  const agotado = producto.stock === 0;

  return (
    <article className={`tarjeta-producto${agotado ? ' es-agotado' : ''}`}>
      <div className="tarjeta-producto-img">
        {producto.imagenUrl ? (
          <img src={producto.imagenUrl} alt={producto.nombre} loading="lazy" />
        ) : (
          <span className="tarjeta-producto-sinimg" aria-hidden>
            💊
          </span>
        )}

        <div className="tarjeta-producto-etiquetas">
          {/* Los productos Rx se marcan: es la diferencia legal entre unos y otros. */}
          {producto.requiereReceta && (
            <span className="etiqueta etiqueta-rx" title="Requiere receta médica">
              Rx
            </span>
          )}
          {porcentaje > 0 && <span className="etiqueta etiqueta-dto">-{porcentaje}%</span>}
        </div>
      </div>

      {(producto.marca || producto.nombreCategoria) && (
        <div className="tarjeta-producto-marca">{producto.marca || producto.nombreCategoria}</div>
      )}

      <h3 className="tarjeta-producto-nombre" title={producto.nombre}>
        {producto.nombre}
      </h3>

      <div className="tarjeta-producto-precios">
        <span className="tarjeta-producto-precio">S/ {producto.precioFinal.toFixed(2)}</span>
        {tieneDescuento && (
          <span className="tarjeta-producto-antes">S/ {producto.precio.toFixed(2)}</span>
        )}
      </div>

      <div className={`tarjeta-producto-stock ${stock.clase}`}>{stock.texto}</div>

      <button
        className="tarjeta-producto-btn"
        disabled={agotado}
        onClick={() => onAgregar(producto)}
      >
        {agotado ? 'Sin stock' : '🛒 Agregar al carrito'}
      </button>
    </article>
  );
}

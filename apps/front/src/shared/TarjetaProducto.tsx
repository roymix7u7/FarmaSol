import type { Producto } from '../types';

interface Props {
  producto: Producto;
  onAgregar: (producto: Producto) => void;
}

function estadoStock(stock: number) {
  if (stock === 0) return { texto: 'Agotado', color: 'var(--rojo)' };
  if (stock < 10) return { texto: `¡Solo ${stock} unidades!`, color: '#d97706' };
  return { texto: `Stock: ${stock}`, color: 'var(--texto-suave)' };
}

/** Tarjeta de producto del catálogo. La comparten el inicio, las categorías y la búsqueda. */
export function TarjetaProducto({ producto, onAgregar }: Props) {
  const stock = estadoStock(producto.stock);
  const tieneDescuento = producto.descuentoUnitario > 0;

  return (
    <article
      style={{
        background: 'var(--blanco)',
        border: '1px solid var(--borde)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--sombra)',
      }}
    >
      <div
        style={{
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          background: '#f9fafb',
          borderRadius: 8,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {producto.imagenUrl ? (
          <img
            src={producto.imagenUrl}
            alt={producto.nombre}
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ fontSize: 48, color: '#d1d5db' }}>💊</div>
        )}

        {/* Los productos Rx se marcan: es la diferencia legal entre unos y otros. */}
        {producto.requiereReceta && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              borderRadius: 6,
              padding: '2px 7px',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Rx
          </span>
        )}
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, minHeight: 40 }}>
        {producto.nombre}
      </div>

      {(producto.marca || producto.nombreCategoria) && (
        <div style={{ fontSize: 12, color: 'var(--texto-suave)', marginBottom: 8 }}>
          {producto.marca || producto.nombreCategoria}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--verde)' }}>
          S/ {producto.precioFinal.toFixed(2)}
        </span>
        {tieneDescuento && (
          <span
            style={{ fontSize: 13, color: 'var(--texto-suave)', textDecoration: 'line-through' }}
          >
            S/ {producto.precio.toFixed(2)}
          </span>
        )}
      </div>

      <div style={{ fontSize: 12, color: stock.color, marginBottom: 10 }}>{stock.texto}</div>

      <button
        disabled={producto.stock === 0}
        onClick={() => onAgregar(producto)}
        style={{
          marginTop: 'auto',
          width: '100%',
          padding: '10px',
          background: producto.stock === 0 ? '#d1d5db' : 'var(--verde)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 13.5,
          cursor: producto.stock === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {producto.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
      </button>
    </article>
  );
}

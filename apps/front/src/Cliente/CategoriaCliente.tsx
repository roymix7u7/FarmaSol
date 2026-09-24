import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { catalogoApi } from '../api/catalogo';
import { carritoApi } from '../api/carrito';
import { useAuth } from '../auth/AuthContext';
import { mensajeDeError } from '../api/client';
import type { Categoria, Producto } from '../types';

/** Busca recursivamente una categoría por su slug (incluye subcategorías). */
function buscarPorSlug(cats: Categoria[], slug: string): Categoria | null {
  for (const c of cats) {
    if (c.slug === slug) return c;
    if (c.subcategorias && c.subcategorias.length > 0) {
      const sub = buscarPorSlug(c.subcategorias, slug);
      if (sub) return sub;
    }
  }
  return null;
}

export function CategoriaCliente() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!slug) return;
    setCargando(true);
    setError('');
    setCategoria(null);
    setProductos([]);

    catalogoApi
      .categoriasArbol()
      .then((cats) => {
        const encontrada = buscarPorSlug(cats, slug);
        if (!encontrada) {
          setError('Categoría no encontrada');
          setCargando(false);
          return null;
        }
        setCategoria(encontrada);
        return catalogoApi.productos({
          idCategoria: encontrada.id,
          incluirSubcategorias: true,
        });
      })
      .then((prods) => {
        if (prods) setProductos(prods);
      })
      .catch(() => setError('No se pudieron cargar los productos'))
      .finally(() => setCargando(false));
  }, [slug]);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }

  async function agregarAlCarrito(prod: Producto) {
    setError('');
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.tipo !== 'CLIENTE') {
      setError('Solo los clientes pueden comprar');
      return;
    }
    try {
      await carritoApi.agregar(prod.id, 1);
      mostrarToast(`✓ ${prod.nombre} agregado al carrito`);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo agregar al carrito'));
    }
  }

  function estadoStock(stock: number) {
    if (stock === 0) return { texto: 'Agotado', color: 'var(--rojo)' };
    if (stock < 10) return { texto: `¡Solo ${stock} unidades!`, color: '#d97706' };
    return { texto: `Stock: ${stock}`, color: 'var(--texto-suave)' };
  }

  return (
    <div>
      {/* Encabezado de categoría */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>
          {categoria ? categoria.nombre : 'Categoría'}
        </h1>
        {categoria?.subcategorias && categoria.subcategorias.length > 0 && (
          <p style={{ color: 'var(--texto-suave)', fontSize: 14 }}>
            {categoria.subcategorias.map((s) => s.nombre).join(' · ')}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Productos */}
      {cargando ? (
        <p style={{ color: 'var(--texto-suave)', textAlign: 'center', padding: 40 }}>
          Cargando productos…
        </p>
      ) : productos.length === 0 && !error ? (
        <p style={{ color: 'var(--texto-suave)', textAlign: 'center', padding: 40 }}>
          No hay productos disponibles en esta categoría.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {productos.map((prod) => {
            const stock = estadoStock(prod.stock);
            const tieneDescuento = prod.descuentoUnitario > 0;

            return (
              <article
                key={prod.id}
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
                  }}
                >
                  {prod.imagenUrl ? (
                    <img
                      src={prod.imagenUrl}
                      alt={prod.nombre}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ fontSize: 48, color: '#d1d5db' }}>💊</div>
                  )}
                </div>

                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, minHeight: 40 }}>
                  {prod.nombre}
                </div>

                {(prod.marca || prod.nombreCategoria) && (
                  <div style={{ fontSize: 12, color: 'var(--texto-suave)', marginBottom: 8 }}>
                    {prod.marca || prod.nombreCategoria}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--verde)' }}>
                    S/ {prod.precioFinal.toFixed(2)}
                  </span>
                  {tieneDescuento && (
                    <span
                      style={{
                        fontSize: 13,
                        color: 'var(--texto-suave)',
                        textDecoration: 'line-through',
                      }}
                    >
                      S/ {prod.precio.toFixed(2)}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: stock.color, marginBottom: 10 }}>
                  {stock.texto}
                </div>

                <button
                  disabled={prod.stock === 0}
                  onClick={() => agregarAlCarrito(prod)}
                  style={{
                    marginTop: 'auto',
                    width: '100%',
                    padding: '10px',
                    background: prod.stock === 0 ? '#d1d5db' : 'var(--verde)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: prod.stock === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {prod.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--verde)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            fontWeight: 600,
            boxShadow: '0 8px 20px rgba(5, 150, 105, 0.35)',
            zIndex: 2000,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
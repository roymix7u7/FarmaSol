import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { catalogoApi } from '../api/catalogo';
import { FiltrosProductos } from '../shared/FiltrosProductos';
import { TarjetaProducto } from '../shared/TarjetaProducto';
import { useAgregarAlCarrito } from '../shared/useAgregarAlCarrito';
import type { Categoria, Producto } from '../types';
import '../Css/Filtros.css';

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

  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtrados, setFiltrados] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const { agregar, error, toast } = useAgregarAlCarrito();

  useEffect(() => {
    if (!slug) return;
    setCargando(true);
    setErrorCarga('');
    setCategoria(null);
    setProductos([]);

    catalogoApi
      .categoriasArbol()
      .then((cats) => {
        const encontrada = buscarPorSlug(cats, slug);
        if (!encontrada) {
          setErrorCarga('Categoría no encontrada');
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
      .catch(() => setErrorCarga('No se pudieron cargar los productos'))
      .finally(() => setCargando(false));
  }, [slug]);

  // useCallback para que el efecto de FiltrosProductos no se dispare de más.
  const recibirFiltrados = useCallback((lista: Producto[]) => setFiltrados(lista), []);

  // Dentro de una categoría, filtrar otra vez por categoría solo sirve si la
  // categoría tiene hijas: ahí las subcategorías son opciones útiles.
  const tieneSubcategorias = (categoria?.subcategorias?.length ?? 0) > 0;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>
          {categoria ? categoria.nombre : 'Categoría'}
        </h1>
        {tieneSubcategorias && (
          <p style={{ color: 'var(--texto-suave)', fontSize: 14 }}>
            {categoria?.subcategorias?.map((s) => s.nombre).join(' · ')}
          </p>
        )}
        {!cargando && !errorCarga && productos.length > 0 && (
          <p className="filtros-resumen" style={{ marginTop: 8 }}>
            <strong>{filtrados.length}</strong>
            {filtrados.length === 1 ? ' producto' : ' productos'}
            {filtrados.length !== productos.length && ` de ${productos.length}`}
          </p>
        )}
      </div>

      {(error || errorCarga) && (
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
          {error || errorCarga}
        </div>
      )}

      {cargando ? (
        <p style={{ color: 'var(--texto-suave)', textAlign: 'center', padding: 40 }}>
          Cargando productos…
        </p>
      ) : productos.length === 0 && !errorCarga ? (
        <p style={{ color: 'var(--texto-suave)', textAlign: 'center', padding: 40 }}>
          No hay productos disponibles en esta categoría.
        </p>
      ) : productos.length > 0 ? (
        <div className="catalogo-layout">
          <FiltrosProductos
            productos={productos}
            onFiltrar={recibirFiltrados}
            mostrarCategorias={tieneSubcategorias}
          />

          {filtrados.length === 0 ? (
            <p style={{ color: 'var(--texto-suave)', textAlign: 'center', padding: 40 }}>
              Ningún producto cumple con los filtros que elegiste.
            </p>
          ) : (
            <div className="grilla-productos columnas-4">
              {filtrados.map((prod) => (
                <TarjetaProducto key={prod.id} producto={prod} onAgregar={agregar} />
              ))}
            </div>
          )}
        </div>
      ) : null}

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

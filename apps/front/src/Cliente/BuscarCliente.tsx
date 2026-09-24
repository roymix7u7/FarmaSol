import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { catalogoApi } from '../api/catalogo';
import { FiltrosProductos } from '../shared/FiltrosProductos';
import { TarjetaProducto } from '../shared/TarjetaProducto';
import { useAgregarAlCarrito } from '../shared/useAgregarAlCarrito';
import type { Producto } from '../types';
import '../Css/Filtros.css';

export function BuscarCliente() {
  const [params] = useSearchParams();
  const consulta = (params.get('q') ?? '').trim();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtrados, setFiltrados] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const { agregar, error, toast } = useAgregarAlCarrito();

  useEffect(() => {
    if (!consulta) {
      setProductos([]);
      setCargando(false);
      return;
    }
    setCargando(true);
    setErrorCarga('');
    catalogoApi
      .productos({ busqueda: consulta })
      .then(setProductos)
      .catch(() => setErrorCarga('No se pudo completar la búsqueda. Inténtalo de nuevo.'))
      .finally(() => setCargando(false));
  }, [consulta]);

  // useCallback para que el efecto de FiltrosProductos no se dispare de más.
  const recibirFiltrados = useCallback((lista: Producto[]) => setFiltrados(lista), []);

  if (!consulta) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Buscar productos</h1>
        <p style={{ color: 'var(--texto-suave)' }}>
          Escribe lo que necesitas en la barra de arriba: un medicamento, una marca o una dolencia.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>
          Resultados para «{consulta}»
        </h1>
        {!cargando && !errorCarga && (
          <p className="filtros-resumen">
            <strong>{filtrados.length}</strong>
            {filtrados.length === 1 ? ' producto encontrado' : ' productos encontrados'}
            {filtrados.length !== productos.length && ` de ${productos.length} en total`}
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
          Buscando…
        </p>
      ) : productos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            No encontramos nada para «{consulta}»
          </h2>
          <p style={{ color: 'var(--texto-suave)', fontSize: 14, marginBottom: 18 }}>
            Revisa que esté bien escrito, o prueba con el nombre de la marca.
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: 'var(--verde)',
              color: '#fff',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            Volver al inicio
          </Link>
        </div>
      ) : (
        <div className="catalogo-layout">
          <FiltrosProductos productos={productos} onFiltrar={recibirFiltrados} mostrarCategorias />

          {filtrados.length === 0 ? (
            <p style={{ color: 'var(--texto-suave)', textAlign: 'center', padding: 40 }}>
              Ningún producto cumple con los filtros que elegiste.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              {filtrados.map((prod) => (
                <TarjetaProducto key={prod.id} producto={prod} onAgregar={agregar} />
              ))}
            </div>
          )}
        </div>
      )}

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

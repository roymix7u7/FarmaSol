import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogoApi } from '../api/catalogo';
import { bannersApi } from '../api/banners';
import { CarruselBanners, type Diapositiva } from '../shared/CarruselBanners';
import { TarjetaProducto } from '../shared/TarjetaProducto';
import { useAgregarAlCarrito } from '../shared/useAgregarAlCarrito';
import type { Categoria, Producto } from '../types';
import '../Css/Tienda.css';

/** De a cuántos productos se muestra la lista de "todos" (son más de cien). */
const POR_PAGINA = 20;

/** Iconos de las categorías que ya tienen dibujo; el resto usa un emoji. */
const ICONO_CATEGORIA: Record<string, string> = {
  farmacia: '/img/menu01-farmacia.png',
  'adulto-mayor': '/img/menu02-anciano.png',
  'mama-y-bebe': '/img/menu03-cuna.png',
  dermocosmetico: '/img/menu04-dermatologia.png',
};
const EMOJI_CATEGORIA: Record<string, string> = {
  galenicos: '🧪',
  cosmeticos: '💄',
  'dispositivos-medicos': '🩺',
};

export function HomeCliente() {
  const { agregar, error, avisos } = useAgregarAlCarrito();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [banners, setBanners] = useState<Diapositiva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [visibles, setVisibles] = useState(POR_PAGINA);

  useEffect(() => {
    catalogoApi
      .productos()
      .then(setProductos)
      .catch(() => setProductos([]))
      .finally(() => setCargando(false));
    catalogoApi.categoriasArbol().then(setCategorias).catch(() => setCategorias([]));

    // El carrusel junta los banners del mantenedor y las promociones marcadas
    // "mostrar en el carrusel". Si una de las dos fuentes falla, sale la otra.
    Promise.all([
      bannersApi.vigentes().catch(() => []),
      catalogoApi.carrusel().catch(() => []),
    ]).then(([propios, promos]) => {
      setBanners([
        ...propios,
        ...promos.map((p) => ({
          id: `promo-${p.id}`,
          titulo: p.titulo,
          subtitulo: p.descripcion,
          imagenUrl: p.imagenBanner,
          colorFondo: '#e53935',
        })),
      ]);
    });
  }, []);

  const ofertas = useMemo(
    () => productos.filter((p) => p.descuentoUnitario > 0 && p.stock > 0).slice(0, 10),
    [productos],
  );

  return (
    <div>
      {banners.length > 0 ? (
        <CarruselBanners banners={banners} />
      ) : (
        <section className="hero-reserva">
          <h1>Tu farmacia de confianza, a un clic</h1>
          <p>
            Medicamentos, dermocosmética y cuidado para toda la familia. Con registro sanitario
            y retiro en botica.
          </p>
        </section>
      )}

      {categorias.length > 0 && (
        <section>
          <div className="seccion-titulo">
            <h2>Compra por categoría</h2>
          </div>
          <div className="categorias-destacadas">
            {categorias.map((c) => (
              <Link key={c.id} to={`/categoria/${c.slug}`} className="categoria-chip">
                <span className="categoria-chip-icono" aria-hidden>
                  {ICONO_CATEGORIA[c.slug] ? (
                    <img src={ICONO_CATEGORIA[c.slug]} alt="" />
                  ) : (
                    EMOJI_CATEGORIA[c.slug] ?? '💊'
                  )}
                </span>
                {c.nombre}
              </Link>
            ))}
          </div>
        </section>
      )}

      {error && <div className="tienda-aviso-error">{error}</div>}

      {ofertas.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="seccion-titulo">
            <h2>🔥 Ofertas de la semana</h2>
            <p>Precios con descuento por tiempo limitado</p>
          </div>
          <div className="grilla-productos columnas-5">
            {ofertas.map((prod) => (
              <TarjetaProducto key={prod.id} producto={prod} onAgregar={agregar} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="seccion-titulo">
          <h2>Nuestros productos</h2>
          {!cargando && productos.length > 0 && (
            <p>
              Mostrando {Math.min(visibles, productos.length)} de {productos.length}
            </p>
          )}
        </div>

        {cargando ? (
          <div className="grilla-productos columnas-5" aria-busy="true" aria-label="Cargando productos">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="tarjeta-esqueleto" />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <p style={{ color: 'var(--texto-suave)', textAlign: 'center', padding: 40 }}>
            No hay productos disponibles por ahora.
          </p>
        ) : (
          <>
            <div className="grilla-productos columnas-5">
              {productos.slice(0, visibles).map((prod) => (
                <TarjetaProducto key={prod.id} producto={prod} onAgregar={agregar} />
              ))}
            </div>
            {visibles < productos.length && (
              <div className="ver-mas">
                <button
                  className="tienda-btn-secundario"
                  onClick={() => setVisibles((v) => v + POR_PAGINA)}
                >
                  Ver más productos ({productos.length - visibles} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {avisos}
    </div>
  );
}

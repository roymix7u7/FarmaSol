import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../Css/Tienda.css';

/** Lo mínimo para pintar una diapositiva. Lo cumplen los banners y la vista previa del panel. */
export interface Diapositiva {
  id: number | string;
  titulo: string;
  subtitulo?: string | null;
  textoBoton?: string | null;
  enlace?: string | null;
  imagenUrl?: string | null;
  colorFondo?: string | null;
}

const COLOR_POR_DEFECTO = '#2ea471';
const SEGUNDOS_POR_DIAPOSITIVA = 6;

function BotonEnlace({ enlace, texto }: { enlace: string; texto: string }) {
  if (enlace.startsWith('/')) {
    return (
      <Link to={enlace} className="banner-btn">
        {texto} →
      </Link>
    );
  }
  return (
    <a href={enlace} className="banner-btn" target="_blank" rel="noreferrer">
      {texto} →
    </a>
  );
}

/** Una diapositiva. El panel la usa sola como vista previa del formulario. */
export function BannerSlide({ banner, compacto = false }: { banner: Diapositiva; compacto?: boolean }) {
  const color = banner.colorFondo || COLOR_POR_DEFECTO;
  return (
    <div
      className={`banner-slide${compacto ? ' es-compacto' : ''}`}
      style={{ ['--banner-color' as string]: color }}
    >
      <div className="banner-texto">
        <h2 className="banner-titulo">{banner.titulo || 'Título del banner'}</h2>
        {banner.subtitulo && <p className="banner-subtitulo">{banner.subtitulo}</p>}
        {banner.enlace && (
          <BotonEnlace enlace={banner.enlace} texto={banner.textoBoton || 'Ver más'} />
        )}
      </div>
      {banner.imagenUrl && (
        <div className="banner-imagen">
          <img src={banner.imagenUrl} alt="" />
        </div>
      )}
    </div>
  );
}

/** Carrusel de la página principal: avanza solo, se pausa con el mouse encima. */
export function CarruselBanners({ banners }: { banners: Diapositiva[] }) {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const total = banners.length;

  const ir = useCallback((i: number) => setActual(((i % total) + total) % total), [total]);

  useEffect(() => {
    if (total < 2 || pausado) return;
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducido) return;
    const id = window.setInterval(() => setActual((a) => (a + 1) % total), SEGUNDOS_POR_DIAPOSITIVA * 1000);
    return () => window.clearInterval(id);
  }, [total, pausado]);

  // Si el gerente quitó banners y el índice quedó fuera de rango.
  useEffect(() => {
    if (actual >= total) setActual(0);
  }, [actual, total]);

  if (total === 0) return null;

  return (
    <section
      className="carrusel"
      aria-roledescription="carrusel"
      aria-label="Promociones destacadas"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="carrusel-pista" style={{ transform: `translateX(-${actual * 100}%)` }}>
        {banners.map((b, i) => (
          <div
            key={b.id}
            className="carrusel-item"
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${total}`}
            aria-hidden={i !== actual}
            // Los enlaces de las diapositivas ocultas no deben recibir el foco.
            inert={i !== actual ? true : undefined}
          >
            <BannerSlide banner={b} />
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button className="carrusel-flecha es-izq" onClick={() => ir(actual - 1)} aria-label="Anterior">
            ‹
          </button>
          <button className="carrusel-flecha es-der" onClick={() => ir(actual + 1)} aria-label="Siguiente">
            ›
          </button>
          <div className="carrusel-puntos">
            {banners.map((b, i) => (
              <button
                key={b.id}
                className={i === actual ? 'activo' : undefined}
                onClick={() => ir(i)}
                aria-label={`Ir al banner ${i + 1}`}
                aria-current={i === actual}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

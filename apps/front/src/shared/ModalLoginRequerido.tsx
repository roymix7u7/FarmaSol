import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Producto } from '../types';
import { guardarCompraPendiente, olvidarCompraPendiente } from './compraPendiente';
import '../Css/Tienda.css';

interface Props {
  /** El producto que quiso agregar. Sin producto (p. ej. desde "Mi carrito") solo pide entrar. */
  producto?: Producto | null;
  onCerrar: () => void;
}

/**
 * Se abre cuando alguien sin sesión intenta comprar. En vez de mandarlo de golpe
 * al login, le explica por qué y le deja elegir entre entrar, crear una cuenta o
 * seguir mirando. Al volver, el producto ya está en su carrito.
 */
export function ModalLoginRequerido({ producto, onCerrar }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const botonPrincipal = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    botonPrincipal.current?.focus();
    function onTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', onTecla);
    // Que la página de atrás no se desplace mientras el modal está abierto.
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onTecla);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onCerrar]);

  function ir(ruta: '/login' | '/registro') {
    if (producto) guardarCompraPendiente(producto.id, producto.nombre);
    else olvidarCompraPendiente();
    // "from" hace que, después de entrar, vuelva a esta misma página.
    navigate(ruta, { state: { from: { pathname: location.pathname + location.search } } });
  }

  return (
    <div className="tienda-modal-fondo" onClick={onCerrar}>
      <div
        className="tienda-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-login-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="tienda-modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <div className="tienda-modal-icono" aria-hidden>
          🛒
        </div>
        <h2 id="modal-login-titulo">Inicia sesión para comprar</h2>
        <p className="tienda-modal-texto">
          Necesitas una cuenta para guardar tu carrito, pagar y seguir tus pedidos.
          {producto && ' Al entrar, agregamos este producto por ti.'}
        </p>

        {producto && (
          <div className="tienda-modal-producto">
            <div className="tienda-modal-producto-img">
              {producto.imagenUrl ? (
                <img src={producto.imagenUrl} alt="" />
              ) : (
                <span aria-hidden>💊</span>
              )}
            </div>
            <div>
              <div className="tienda-modal-producto-nombre">{producto.nombre}</div>
              <div className="tienda-modal-producto-precio">
                S/ {producto.precioFinal.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <div className="tienda-modal-acciones">
          <button ref={botonPrincipal} className="btn-primario" onClick={() => ir('/login')}>
            Iniciar sesión
          </button>
          <button className="tienda-btn-secundario" onClick={() => ir('/registro')}>
            Crear cuenta gratis
          </button>
        </div>
        <button className="tienda-modal-seguir" onClick={onCerrar}>
          Seguir viendo productos
        </button>
      </div>
    </div>
  );
}

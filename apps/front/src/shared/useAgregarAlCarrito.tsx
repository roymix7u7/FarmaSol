import { useCallback, useEffect, useRef, useState } from 'react';
import { carritoApi } from '../api/carrito';
import { mensajeDeError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Producto } from '../types';
import { avisarCambioCarrito, tomarAviso } from './compraPendiente';
import { ModalLoginRequerido } from './ModalLoginRequerido';

/**
 * Agregar al carrito desde cualquier listado de productos. Sin sesión abre el
 * modal que invita a entrar o registrarse; con sesión de personal lo bloquea; y
 * avisa con un toast. La página solo tiene que pintar `avisos`.
 */
export function useAgregarAlCarrito() {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [pideLogin, setPideLogin] = useState<Producto | null>(null);
  const temporizador = useRef<number | undefined>(undefined);

  const mostrarToast = useCallback((mensaje: string) => {
    setToast(mensaje);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  // Al volver del login con una compra pendiente, aquí se ve el resultado.
  useEffect(() => {
    const aviso = tomarAviso();
    if (aviso?.tipo === 'ok') mostrarToast(aviso.texto);
    if (aviso?.tipo === 'error') setError(aviso.texto);
    return () => window.clearTimeout(temporizador.current);
  }, [mostrarToast]);

  async function agregar(producto: Producto) {
    setError('');
    if (!user) {
      setPideLogin(producto);
      return;
    }
    if (user.tipo !== 'CLIENTE') {
      setError('Solo los clientes pueden comprar');
      return;
    }
    try {
      await carritoApi.agregar(producto.id, 1);
      mostrarToast(`✓ ${producto.nombre} agregado al carrito`);
      avisarCambioCarrito();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo agregar al carrito'));
    }
  }

  const cerrarModal = useCallback(() => setPideLogin(null), []);

  const avisos = (
    <>
      {toast && (
        <div className="tienda-toast" role="status">
          {toast}
        </div>
      )}
      {pideLogin && <ModalLoginRequerido producto={pideLogin} onCerrar={cerrarModal} />}
    </>
  );

  return { agregar, error, setError, toast, avisos };
}

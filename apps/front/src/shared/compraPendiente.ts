import { carritoApi } from '../api/carrito';
import { mensajeDeError } from '../api/client';

/**
 * Lo que el visitante quiso comprar antes de iniciar sesión. Se guarda al pulsar
 * "Iniciar sesión" o "Crear cuenta" en el modal y se agrega al carrito en cuanto
 * entra, para que no tenga que volver a buscar el producto.
 *
 * Va en sessionStorage: si cierra la pestaña sin entrar, se olvida.
 */
const CLAVE_PENDIENTE = 'farmasol_compra_pendiente';
const CLAVE_AVISO = 'farmasol_aviso';

interface CompraPendiente {
  idProducto: number;
  nombre: string;
}

export interface Aviso {
  tipo: 'ok' | 'error';
  texto: string;
}

function leer<T>(clave: string): T | null {
  try {
    const raw = sessionStorage.getItem(clave);
    sessionStorage.removeItem(clave);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: unknown) {
  try {
    sessionStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin sessionStorage (modo privado estricto) solo se pierde la comodidad.
  }
}

export function guardarCompraPendiente(idProducto: number, nombre: string) {
  escribir(CLAVE_PENDIENTE, { idProducto, nombre } satisfies CompraPendiente);
}

export function olvidarCompraPendiente() {
  try {
    sessionStorage.removeItem(CLAVE_PENDIENTE);
  } catch {
    // nada que hacer
  }
}

/**
 * Se llama justo después de iniciar sesión o registrarse. Si había un producto
 * esperando, lo agrega y deja un aviso para la página a la que vuelve el cliente.
 */
export async function completarCompraPendiente() {
  const pendiente = leer<CompraPendiente>(CLAVE_PENDIENTE);
  if (!pendiente) return;
  try {
    await carritoApi.agregar(pendiente.idProducto, 1);
    escribir(CLAVE_AVISO, { tipo: 'ok', texto: `✓ ${pendiente.nombre} agregado al carrito` });
    avisarCambioCarrito();
  } catch (err) {
    escribir(CLAVE_AVISO, {
      tipo: 'error',
      texto: mensajeDeError(err, `No se pudo agregar ${pendiente.nombre} al carrito`),
    });
  }
}

/** El aviso que dejó completarCompraPendiente, una sola vez. */
export function tomarAviso(): Aviso | null {
  return leer<Aviso>(CLAVE_AVISO);
}

/** Evento para que la cabecera actualice el contador del carrito. */
export const EVENTO_CARRITO = 'farmasol:carrito';

export function avisarCambioCarrito() {
  window.dispatchEvent(new Event(EVENTO_CARRITO));
}

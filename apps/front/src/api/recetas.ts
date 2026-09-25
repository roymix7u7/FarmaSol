import { api } from './client';

export type EstadoReceta = 'PENDIENTE_REVISION' | 'APROBADA' | 'RECHAZADA';

/** Espejo de RecetaResponse del backend. */
export interface Receta {
  id: number;
  idPedido: number;
  codigoPedido: string;
  idPedidoDetalle: number;
  nombreProducto: string;
  cantidad: number;
  nombreCliente: string;
  estado: EstadoReceta;
  motivoRechazo: string | null;
  revisadoPor: string | null;
  fechaSubida: string;
  fechaRevision: string | null;
}

export const recetasApi = {
  /** Sube la receta de una línea del pedido. El backend la deja en revisión. */
  subir(idPedidoDetalle: number, archivo: File) {
    const datos = new FormData();
    datos.append('archivo', archivo);
    // Sin Content-Type explícito: el navegador pone el boundary del multipart.
    return api
      .post<Receta>(`/pedidos/detalles/${idPedidoDetalle}/receta`, datos, {
        headers: { 'Content-Type': undefined },
      })
      .then((r) => r.data);
  },

  deUnPedido(idPedido: number) {
    return api.get<Receta[]>(`/pedidos/${idPedido}/recetas`).then((r) => r.data);
  },
};

/** Límites que acepta el backend (application.properties: max-file-size 5MB). */
export const RECETA_MAX_BYTES = 5 * 1024 * 1024;
export const RECETA_TIPOS = ['application/pdf', 'image/jpeg', 'image/png'];

/** Valida antes de subir, para dar un error claro en vez de un 500. */
export function validarArchivoReceta(archivo: File): string | null {
  if (!RECETA_TIPOS.includes(archivo.type)) {
    return 'El archivo debe ser PDF, JPG o PNG.';
  }
  if (archivo.size > RECETA_MAX_BYTES) {
    return 'El archivo no puede pesar más de 5 MB.';
  }
  return null;
}

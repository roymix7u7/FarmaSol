import { api } from './client';

export type TipoIncidencia = 'STOCK' | 'PRODUCTO_DANADO' | 'RECETA' | 'CAJA' | 'SISTEMA' | 'OTRO';
export type EstadoIncidencia = 'PENDIENTE' | 'RESUELTA';

export const TIPOS_INCIDENCIA: { valor: TipoIncidencia; texto: string; icono: string }[] = [
  { valor: 'STOCK', texto: 'Diferencia de stock en el anaquel', icono: 'fa-boxes-stacked' },
  { valor: 'PRODUCTO_DANADO', texto: 'Producto dañado o vencido', icono: 'fa-box-open' },
  { valor: 'RECETA', texto: 'Problema con una receta médica', icono: 'fa-file-medical' },
  { valor: 'CAJA', texto: 'Problema de caja o de pago', icono: 'fa-cash-register' },
  { valor: 'SISTEMA', texto: 'Falla del sistema', icono: 'fa-desktop' },
  { valor: 'OTRO', texto: 'Otro motivo', icono: 'fa-circle-question' },
];

export function textoTipo(tipo: TipoIncidencia) {
  return TIPOS_INCIDENCIA.find((t) => t.valor === tipo)?.texto ?? tipo;
}

export interface Incidencia {
  id: number;
  tipo: TipoIncidencia;
  urgente: boolean;
  referencia: string | null;
  descripcion: string;
  estado: EstadoIncidencia;
  reportadoPor: string;
  fechaReporte: string;
  resueltoPor: string | null;
  respuesta: string | null;
  fechaResolucion: string | null;
}

export interface IncidenciaPayload {
  tipo: TipoIncidencia;
  urgente: boolean;
  referencia: string | null;
  descripcion: string;
}

export const incidenciasApi = {
  reportar(payload: IncidenciaPayload) {
    return api.post<Incidencia>('/incidencias', payload).then((r) => r.data);
  },

  /** Lo que reportó el usuario conectado. */
  mias() {
    return api.get<Incidencia[]>('/incidencias/mias').then((r) => r.data);
  },

  /** Todos los reportes del personal (solo gerente). */
  listar(estado?: EstadoIncidencia) {
    return api.get<Incidencia[]>('/incidencias', { params: { estado } }).then((r) => r.data);
  },

  resolver(id: number, respuesta: string | null) {
    return api.patch<Incidencia>(`/incidencias/${id}/resolver`, { respuesta }).then((r) => r.data);
  },
};

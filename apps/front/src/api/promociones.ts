import { api } from './client';

export type TipoDescuento = 'PORCENTAJE' | 'MONTO';

export interface Promocion {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipoDescuento: TipoDescuento;
  valorDescuento: number;
  fechaInicio: string;
  fechaFin: string;
  imagenBanner: string | null;
  mostrarEnCarrusel: boolean;
  orden: number;
  activo: boolean;
  /** Lo calcula el backend: activa y dentro del rango de fechas. */
  vigente: boolean;
  idsProductos: number[];
  idsCategorias: number[];
}

export interface PromocionPayload {
  titulo: string;
  descripcion: string | null;
  tipoDescuento: TipoDescuento;
  valorDescuento: number;
  fechaInicio: string;
  fechaFin: string;
  imagenBanner: string | null;
  mostrarEnCarrusel: boolean;
  orden: number;
  idsProductos: number[];
  idsCategorias: number[];
}

export const promocionesApi = {
  listar() {
    return api.get<Promocion[]>('/promociones').then((r) => r.data);
  },

  crear(payload: PromocionPayload) {
    return api.post<Promocion>('/promociones', payload).then((r) => r.data);
  },

  actualizar(id: number, payload: PromocionPayload) {
    return api.put<Promocion>(`/promociones/${id}`, payload).then((r) => r.data);
  },

  eliminar(id: number) {
    return api.delete<void>(`/promociones/${id}`);
  },
};

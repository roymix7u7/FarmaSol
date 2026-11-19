import { api } from './client';

export interface Banner {
  id: number;
  titulo: string;
  subtitulo: string | null;
  textoBoton: string | null;
  /** Ruta de la tienda (/categoria/farmacia) o URL completa. */
  enlace: string | null;
  imagenUrl: string | null;
  colorFondo: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  orden: number;
  activo: boolean;
  /** Lo calcula el backend: activo y dentro de sus fechas. */
  vigente: boolean;
}

export type BannerPayload = Omit<Banner, 'id' | 'vigente'>;

export const bannersApi = {
  /** Los que se ven hoy en la página principal. Público. */
  vigentes() {
    return api.get<Banner[]>('/banners/vigentes').then((r) => r.data);
  },

  listar() {
    return api.get<Banner[]>('/banners').then((r) => r.data);
  },

  crear(payload: BannerPayload) {
    return api.post<Banner>('/banners', payload).then((r) => r.data);
  },

  actualizar(id: number, payload: BannerPayload) {
    return api.put<Banner>(`/banners/${id}`, payload).then((r) => r.data);
  },

  cambiarActivo(id: number, activo: boolean) {
    return api.patch<Banner>(`/banners/${id}/activo`, { activo }).then((r) => r.data);
  },

  eliminar(id: number) {
    return api.delete<void>(`/banners/${id}`);
  },

  /** Reutiliza el mismo almacén de imágenes que los productos. */
  subirImagen(archivo: File) {
    const datos = new FormData();
    datos.append('archivo', archivo);
    return api
      .post<{ url: string }>('/productos/upload-imagen', datos, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.url);
  },
};

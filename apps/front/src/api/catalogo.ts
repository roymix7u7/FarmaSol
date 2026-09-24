import { api } from './client';
import type { Categoria, Producto, PromocionBanner } from '../types';

export const catalogoApi = {
  categoriasArbol() {
    return api.get<Categoria[]>('/categorias', { params: { arbol: true } }).then((r) => r.data);
  },

  productos(params?: { busqueda?: string; idCategoria?: number; incluirSubcategorias?: boolean }) {
    return api.get<Producto[]>('/productos', { params }).then((r) => r.data);
  },

  producto(id: number) {
    return api.get<Producto>(`/productos/${id}`).then((r) => r.data);
  },

  carrusel() {
    return api.get<PromocionBanner[]>('/promociones/carrusel').then((r) => r.data);
  },
};

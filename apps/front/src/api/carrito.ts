import { api } from './client';

export interface CarritoItem {
  idProducto: number;
  nombre: string;
  imagenUrl: string | null;
  precioUnitario: number;
  precioFinal: number;
  descuentoUnitario: number;
  cantidad: number;
  subtotal: number;
  stockDisponible: number;
}

export interface Carrito {
  idCarrito: number;
  items: CarritoItem[];
  cantidadItems: number;
  subtotal: number;
  descuentoTotal: number;
  total: number;
}

export const carritoApi = {
  ver() {
    return api.get<Carrito>('/carrito').then((r) => r.data);
  },

  agregar(idProducto: number, cantidad: number = 1) {
    return api.post<Carrito>('/carrito/items', { idProducto, cantidad }).then((r) => r.data);
  },

  actualizar(idProducto: number, cantidad: number) {
    return api
      .put<Carrito>(`/carrito/items/${idProducto}`, { cantidad })
      .then((r) => r.data);
  },

  eliminar(idProducto: number) {
    return api.delete<Carrito>(`/carrito/items/${idProducto}`).then((r) => r.data);
  },

  vaciar() {
    return api.delete('/carrito').then((r) => r.data);
  },
};
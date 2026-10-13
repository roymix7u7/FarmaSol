import { api } from './client';
import { diasDesdeHoy, hoyISO } from '../shared/fechas';
import type { EstadoPedido } from './pedidos';

export interface VentasPorPeriodo {
  dia: string;
  /** Operaciones del día: pedidos web más ventas en tienda. */
  cantidadPedidos: number;
  /** Total del día: web más tienda. */
  monto: number;
  /** Parte de lo anterior que se vendió en el mostrador. */
  cantidadPresencial: number;
  montoPresencial: number;
}

export interface ProductoMasVendido {
  idProducto: number;
  nombreProducto: string;
  unidadesVendidas: number;
  montoTotal: number;
}

export interface StockBajo {
  idProducto: number;
  nombre: string;
  categoria: string;
  stock: number;
}

export interface PedidosPorEstado {
  estado: EstadoPedido;
  cantidad: number;
  monto: number;
}

/** Rango de los últimos `dias` días, hoy incluido, en la zona del usuario. */
export function rangoUltimosDias(dias: number) {
  return { desde: diasDesdeHoy(-(dias - 1)), hasta: hoyISO() };
}

export const reportesApi = {
  ventas(desde?: string, hasta?: string) {
    return api
      .get<VentasPorPeriodo[]>('/reportes/ventas', { params: { desde, hasta } })
      .then((r) => r.data);
  },

  productosMasVendidos(desde?: string, hasta?: string, limit = 10) {
    return api
      .get<ProductoMasVendido[]>('/reportes/productos-mas-vendidos', {
        params: { desde, hasta, limit },
      })
      .then((r) => r.data);
  },

  stockBajo(umbral = 10) {
    return api.get<StockBajo[]>('/reportes/stock-bajo', { params: { umbral } }).then((r) => r.data);
  },

  pedidosPorEstado(desde?: string, hasta?: string) {
    return api
      .get<PedidosPorEstado[]>('/reportes/pedidos-por-estado', { params: { desde, hasta } })
      .then((r) => r.data);
  },
};

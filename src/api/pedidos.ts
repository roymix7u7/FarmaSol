import { api } from './client';

export type EstadoPedido =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface PedidoResumen {
  id: number;
  codigoPedido: string;
  nombreCliente: string;
  estado: EstadoPedido;
  requiereReceta: boolean;
  total: number;
  cantidadItems: number;
  fechaPedido: string;
}

export interface PedidoDetalle {
  idPedidoDetalle: number;
  idProducto: number | null;
  nombreProducto: string;
  precioUnitario: number;
  descuentoUnitario: number;
  cantidad: number;
  subtotal: number;
  requiereReceta: boolean;
  estadoReceta: 'PENDIENTE_REVISION' | 'APROBADA' | 'RECHAZADA' | null;
  idRecetaVigente: number | null;
}

export interface PedidoCompleto {
  id: number;
  codigoPedido: string;
  idCliente: number;
  nombreCliente: string;
  estado: EstadoPedido;
  tipoEntrega: 'DELIVERY' | 'RECOJO_TIENDA';
  requiereReceta: boolean;
  subtotal: number;
  descuentoTotal: number;
  costoEnvio: number;
  total: number;
  envioQuienRecibe: string | null;
  envioTelefono: string | null;
  envioDireccion: string | null;
  envioDistrito: string | null;
  envioReferencia: string | null;
  recojoSede: string | null;
  recojoNombre: string | null;
  recojoDni: string | null;
  fechaPedido: string;
  fechaConfirmacion: string | null;
  fechaEntrega: string | null;
  atendidoPor: string | null;
  notas: string | null;
  detalles: PedidoDetalle[];
}

export const pedidosApi = {
  misPedidos() {
    return api.get<PedidoResumen[]>('/pedidos/mios').then((r) => r.data);
  },

  miPedido(id: number) {
    return api.get<PedidoCompleto>(`/pedidos/mios/${id}`).then((r) => r.data);
  },
};
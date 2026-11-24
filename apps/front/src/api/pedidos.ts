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
  /** Qué se compró: alcanza para la vista previa en la lista. */
  productos: ProductoResumen[];
  fechaPedido: string;
}

export interface ProductoResumen {
  nombreProducto: string;
  cantidad: number;
  subtotal: number;
  requiereReceta: boolean;
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
 async misPedidos() {
    const response = await api.get<PedidoResumen[]>('/pedidos/mios');
    return response.data;
  },

  /** El pedido completo, con cada línea y el estado de su receta. */
  async miPedido(idPedido: number) {
    const response = await api.get<PedidoCompleto>(`/pedidos/mios/${idPedido}`);
    return response.data;
  },

  // Añade esta función para la cancelación:
  async cancelarPedido(idPedido: number, motivo: string) {
    const response = await api.patch(`/pedidos/mios/${idPedido}/cancelar`, { motivo });
    return response.data;
  }
};

/** Operaciones del panel de gestión (requieren rol GERENTE o EMPLEADO). */
export const pedidosAdminApi = {
  listar(estado?: EstadoPedido) {
    return api.get<PedidoResumen[]>('/pedidos', { params: { estado } }).then((r) => r.data);
  },

  obtener(id: number) {
    return api.get<PedidoCompleto>(`/pedidos/${id}`).then((r) => r.data);
  },

  cambiarEstado(id: number, nuevoEstado: EstadoPedido, motivo?: string) {
    return api.patch<PedidoCompleto>(`/pedidos/${id}/estado`, { nuevoEstado, motivo }).then((r) => r.data);
  },
};

/** Transiciones permitidas: evita ofrecer saltos que el backend rechazaria. */
export const SIGUIENTES_ESTADOS: Record<EstadoPedido, EstadoPedido[]> = {
  PENDIENTE: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['EN_CAMINO', 'CANCELADO'],
  EN_CAMINO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

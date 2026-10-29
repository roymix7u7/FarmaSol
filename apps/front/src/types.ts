export type Rol = 'GERENTE' | 'EMPLEADO' | 'CLIENTE';
export type TipoUsuario = 'PERSONAL' | 'CLIENTE';
export type TipoEntrega = 'DELIVERY' | 'RECOJO_TIENDA';
export type EstadoPedido =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface AuthUser {
  tipo: TipoUsuario;
  rol: Rol;
  uid: number;
  nombres: string;
}

export interface AuthResponse {
  token: string;
  tipo: TipoUsuario;
  rol: Rol;
  uid: number;
  nombres: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  idCategoriaPadre: number | null;
  nombrePadre: string | null;
  descripcion: string | null;
  imagenUrl: string | null;
  orden: number;
  activo: boolean;
  subcategorias?: Categoria[];
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precioFinal: number;
  descuentoUnitario: number;
  idPromocionAplicada: number | null;
  stock: number;
  idCategoria: number;
  nombreCategoria: string;
  imagenUrl: string | null;
  requiereReceta: boolean;
  marca: string | null;
  presentacion: string | null;
  registroSanitario: string | null;
  activo: boolean;
}

export interface PromocionBanner {
  id: number;
  titulo: string;
  descripcion: string | null;
  imagenBanner: string | null;
  orden: number;
}

export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  distrito: string | null;
  horario: string | null;
  activo: boolean;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  mensaje: string;
  path: string;
  validaciones?: Record<string, string>;
}

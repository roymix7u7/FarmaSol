import { api } from './client';
import type { TipoDocumento } from '../shared/validaciones';

export type MetodoPago = 'EFECTIVO' | 'YAPE' | 'TARJETA';
export type MarcaTarjeta = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DINERS';

export const METODOS_PAGO: { valor: MetodoPago; etiqueta: string; icono: string }[] = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo', icono: 'fa-money-bill-wave' },
  { valor: 'YAPE', etiqueta: 'Yape', icono: 'fa-mobile-screen-button' },
  { valor: 'TARJETA', etiqueta: 'Tarjeta', icono: 'fa-credit-card' },
];

export const MARCAS_TARJETA: { valor: MarcaTarjeta; etiqueta: string }[] = [
  { valor: 'VISA', etiqueta: 'Visa' },
  { valor: 'MASTERCARD', etiqueta: 'Mastercard' },
  { valor: 'AMEX', etiqueta: 'American Express' },
  { valor: 'DINERS', etiqueta: 'Diners Club' },
];

export function etiquetaMetodo(m: MetodoPago) {
  return METODOS_PAGO.find((x) => x.valor === m)?.etiqueta ?? m;
}

export function etiquetaMarca(m: MarcaTarjeta | null) {
  return MARCAS_TARJETA.find((x) => x.valor === m)?.etiqueta ?? m ?? '';
}

export interface VentaRequest {
  items: { idProducto: number; cantidad: number; recetaVerificada: boolean }[];
  metodoPago: MetodoPago;
  montoRecibido?: number;
  codigoOperacion?: string;
  tarjetaMarca?: MarcaTarjeta;
  tarjetaUltimos4?: string;
  cliente?: { tipoDocumento: TipoDocumento; documento: string; nombre: string };
}

export interface LineaVenta {
  idProducto: number | null;
  nombreProducto: string;
  precioUnitario: number;
  descuentoUnitario: number;
  cantidad: number;
  subtotal: number;
  requiereReceta: boolean;
  recetaVerificada: boolean;
}

export interface Venta {
  id: number;
  codigoVenta: string;
  fechaVenta: string;
  idVendedor: number;
  vendidoPor: string;
  clienteTipoDocumento: TipoDocumento | null;
  clienteDocumento: string | null;
  clienteNombre: string | null;
  detalles: LineaVenta[];
  cantidadItems: number;
  subtotal: number;
  descuentoTotal: number;
  total: number;
  metodoPago: MetodoPago;
  montoRecibido: number;
  vuelto: number;
  codigoOperacion: string | null;
  tarjetaMarca: MarcaTarjeta | null;
  tarjetaUltimos4: string | null;
  anulada: boolean;
  anuladaPor: string | null;
  fechaAnulacion: string | null;
  motivoAnulacion: string | null;
}

export interface ResumenCaja {
  fecha: string;
  todoElPersonal: boolean;
  cantidadVentas: number;
  totalVendido: number;
  efectivoEnCaja: number;
  totalPorMetodo: Record<MetodoPago, number>;
  cantidadPorMetodo: Record<MetodoPago, number>;
  cantidadAnuladas: number;
  montoAnulado: number;
}

export const ventasApi = {
  registrar(venta: VentaRequest) {
    return api.post<Venta>('/ventas-presenciales', venta).then((r) => r.data);
  },

  delDia(fecha?: string) {
    return api.get<Venta[]>('/ventas-presenciales', { params: { fecha } }).then((r) => r.data);
  },

  resumen(fecha?: string) {
    return api.get<ResumenCaja>('/ventas-presenciales/resumen', { params: { fecha } }).then((r) => r.data);
  },

  anular(id: number, motivo: string) {
    return api.patch<Venta>(`/ventas-presenciales/${id}/anular`, { motivo }).then((r) => r.data);
  },
};

// --- Reglas del pago. Espejo de validation/Reglas.java: si cambia una, cambia la otra.

export function validarYape(codigo: string): string | null {
  return /^[0-9]{6,12}$/.test(codigo) ? null : 'El número de operación de Yape debe tener entre 6 y 12 dígitos';
}

export function validarVoucher(codigo: string): string | null {
  return /^[0-9]{4,12}$/.test(codigo) ? null : 'El número de operación del voucher debe tener entre 4 y 12 dígitos';
}

export function validarUltimos4(valor: string): string | null {
  return /^[0-9]{4}$/.test(valor) ? null : 'Escribe solo los 4 últimos dígitos de la tarjeta';
}

/** Por encima de este total la boleta debe identificar al comprador (SUNAT). */
export const UMBRAL_BOLETA = 700;

/**
 * Suma de dinero en céntimos enteros. Sumar decimales en JavaScript acumula
 * errores (0.1 + 0.2 = 0.30000000000000004), y en una caja eso descuadra.
 */
export function aCentimos(soles: number) {
  return Math.round(soles * 100);
}

export function soles(monto: number) {
  return `S/ ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

import { isoLocal } from './fechas';
import type { VentasPorPeriodo } from '../api/reportes';

/**
 * Completa la serie de ventas con los días que no tuvieron ninguna.
 *
 * El backend solo devuelve los días con ventas. Si se graficara tal cual, dos
 * días separados por una semana saldrían pegados y el gráfico mentiría sobre la
 * forma de la tendencia.
 */
export function serieCompleta(ventas: VentasPorPeriodo[], dias: number): VentasPorPeriodo[] {
  const porDia = new Map(ventas.map((v) => [v.dia, v]));
  const serie: VentasPorPeriodo[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const f = new Date();
    f.setDate(f.getDate() - i);
    const dia = isoLocal(f);
    serie.push(porDia.get(dia) ?? { dia, cantidadPedidos: 0, monto: 0, cantidadPresencial: 0, montoPresencial: 0 });
  }
  return serie;
}

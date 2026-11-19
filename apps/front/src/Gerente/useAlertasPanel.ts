import { useCallback, useEffect, useState } from 'react';
import { incidenciasApi, type Incidencia } from '../api/incidencias';
import { pedidosAdminApi, type PedidoResumen } from '../api/pedidos';
import { recetasAdminApi, type Receta } from '../api/recetas';
import { reportesApi, type StockBajo } from '../api/reportes';

/** Mismo umbral que el Resumen, los Reportes y el Inventario. */
export const STOCK_BAJO = 10;
const CADA_MS = 60_000;
const CLAVE_VISTAS = 'farmasol_alertas_vistas';

export type DestinoAlerta =
  | { vista: 'inventario'; filtro: 'agotados' | 'por-agotar' }
  | { vista: 'recetas' }
  | { vista: 'pedidos' }
  | { vista: 'incidencias' };

export interface Alerta {
  /** Identifica el tipo de alerta; junto con `cantidad` decide si ya se vio. */
  clave: string;
  nivel: 'peligro' | 'aviso' | 'info';
  icono: string;
  titulo: string;
  detalle: string;
  cantidad: number;
  destino: DestinoAlerta;
}

function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`;
}

function nombres(lista: { nombre: string }[]) {
  const primeros = lista.slice(0, 3).map((p) => p.nombre);
  const resto = lista.length - primeros.length;
  return primeros.join(', ') + (resto > 0 ? ` y ${resto} más` : '');
}

/** Arma las alertas a partir de lo que ya tiene el sistema. Solo lo que pide acción. */
function construir(
  stock: StockBajo[],
  recetas: Receta[],
  pendientes: PedidoResumen[],
  reportes: Incidencia[],
  esGerente: boolean,
): Alerta[] {
  const alertas: Alerta[] = [];

  // Reportes del personal: al gerente le llegan los pendientes; al trabajador,
  // los suyos que el gerente ya resolvió.
  if (esGerente) {
    const porResolver = reportes.filter((r) => r.estado === 'PENDIENTE');
    if (porResolver.length > 0) {
      const urgentes = porResolver.filter((r) => r.urgente).length;
      alertas.push({
        clave: 'reportes-pendientes',
        nivel: urgentes > 0 ? 'peligro' : 'aviso',
        icono: 'fa-flag',
        titulo: plural(porResolver.length, 'reporte del personal', 'reportes del personal'),
        detalle:
          (urgentes > 0 ? `${plural(urgentes, 'urgente', 'urgentes')}. ` : '') +
          `Último: ${porResolver[0].reportadoPor} — "${porResolver[0].descripcion.slice(0, 60)}${porResolver[0].descripcion.length > 60 ? '…' : ''}"`,
        cantidad: porResolver.length,
        destino: { vista: 'incidencias' },
      });
    }
  } else {
    const resueltos = reportes.filter((r) => r.estado === 'RESUELTA');
    if (resueltos.length > 0) {
      alertas.push({
        clave: 'reportes-resueltos',
        nivel: 'info',
        icono: 'fa-circle-check',
        titulo: plural(resueltos.length, 'reporte tuyo resuelto', 'reportes tuyos resueltos'),
        detalle: resueltos[0].respuesta
          ? `El gerente respondió: "${resueltos[0].respuesta.slice(0, 70)}${resueltos[0].respuesta.length > 70 ? '…' : ''}"`
          : `Lo resolvió ${resueltos[0].resueltoPor}.`,
        cantidad: resueltos.length,
        destino: { vista: 'incidencias' },
      });
    }
  }

  const agotados = stock.filter((p) => p.stock === 0);
  const porAgotar = stock.filter((p) => p.stock > 0).sort((a, b) => a.stock - b.stock);

  if (agotados.length > 0) {
    alertas.push({
      clave: 'agotados',
      nivel: 'peligro',
      icono: 'fa-circle-xmark',
      titulo: plural(agotados.length, 'producto agotado', 'productos agotados'),
      detalle: nombres(agotados),
      cantidad: agotados.length,
      destino: { vista: 'inventario', filtro: 'agotados' },
    });
  }
  if (recetas.length > 0) {
    alertas.push({
      clave: 'recetas',
      nivel: 'aviso',
      icono: 'fa-file-medical',
      titulo: plural(recetas.length, 'receta por revisar', 'recetas por revisar'),
      detalle: 'Esos pedidos no avanzan hasta que se aprueben.',
      cantidad: recetas.length,
      destino: { vista: 'recetas' },
    });
  }
  if (pendientes.length > 0) {
    alertas.push({
      clave: 'pedidos',
      nivel: 'info',
      icono: 'fa-receipt',
      titulo: plural(pendientes.length, 'pedido sin confirmar', 'pedidos sin confirmar'),
      // Cuenta todos, no solo los del mes: un pedido viejo sin atender también es un pendiente.
      detalle: `Incluye los de semanas anteriores. El más reciente: ${pendientes[0].codigoPedido}.`,
      cantidad: pendientes.length,
      destino: { vista: 'pedidos' },
    });
  }
  if (porAgotar.length > 0) {
    alertas.push({
      clave: 'por-agotar',
      nivel: 'aviso',
      icono: 'fa-triangle-exclamation',
      titulo: plural(porAgotar.length, 'producto por agotar', 'productos por agotar'),
      detalle: `Con menos stock: ${nombres(porAgotar.map((p) => ({ nombre: `${p.nombre} (${p.stock})` })))}`,
      cantidad: porAgotar.length,
      destino: { vista: 'inventario', filtro: 'por-agotar' },
    });
  }
  return alertas;
}

function leerVistas(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_VISTAS) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

/**
 * Alertas del panel: stock agotado o bajo, recetas por revisar y pedidos
 * pendientes. Se vuelven a pedir cada minuto y cuando el usuario regresa a la
 * pestaña. Una alerta cuenta como "nueva" hasta que se abre la campana, y vuelve
 * a serlo si su número cambia (p. ej. llega otra receta).
 */
export function useAlertasPanel(esGerente: boolean) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [conteos, setConteos] = useState({ recetas: 0, pedidos: 0, incidencias: 0 });
  const [vistas, setVistas] = useState<Record<string, number>>(leerVistas);

  const recargar = useCallback(() => {
    Promise.all([
      reportesApi.stockBajo(STOCK_BAJO).catch(() => [] as StockBajo[]),
      recetasAdminApi.pendientes().catch(() => [] as Receta[]),
      pedidosAdminApi.listar('PENDIENTE').catch(() => [] as PedidoResumen[]),
      (esGerente ? incidenciasApi.listar('PENDIENTE') : incidenciasApi.mias()).catch(
        () => [] as Incidencia[],
      ),
    ]).then(([stock, recetas, pendientes, reportes]) => {
      setAlertas(construir(stock, recetas, pendientes, reportes, esGerente));
      setConteos({
        recetas: recetas.length,
        pedidos: pendientes.length,
        // Al gerente le cuenta lo que debe resolver; al trabajador, lo que espera respuesta.
        incidencias: reportes.filter((r) => r.estado === 'PENDIENTE').length,
      });
    });
  }, [esGerente]);

  useEffect(() => {
    recargar();
    const id = window.setInterval(recargar, CADA_MS);
    const alVolver = () => document.visibilityState === 'visible' && recargar();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [recargar]);

  const nuevas = alertas.filter((a) => vistas[a.clave] !== a.cantidad).length;

  const marcarVistas = useCallback(() => {
    const todas = Object.fromEntries(alertas.map((a) => [a.clave, a.cantidad]));
    setVistas(todas);
    try {
      localStorage.setItem(CLAVE_VISTAS, JSON.stringify(todas));
    } catch {
      // Sin almacenamiento solo se pierde recordar qué se vio.
    }
  }, [alertas]);

  return { alertas, nuevas, conteos, recargar, marcarVistas };
}

import { useEffect, useState } from 'react';
import { mensajeDeError } from '../api/client';
import {
  rangoUltimosDias,
  reportesApi,
  type PedidosPorEstado,
  type ProductoMasVendido,
  type StockBajo,
  type VentasPorPeriodo,
} from '../api/reportes';
import { recetasAdminApi, type Receta } from '../api/recetas';
import type { EstadoPedido } from '../api/pedidos';
import { serieCompleta } from '../shared/serieVentas';
import '../Css/Dashboard.css';

/** Color del punto de cada estado. Siempre va acompañado del nombre escrito. */
const COLOR_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE: '#d97706',
  CONFIRMADO: '#1a56db',
  EN_CAMINO: '#7c3aed',
  ENTREGADO: '#2ea471',
  CANCELADO: '#e53935',
};

const NOMBRE_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const ORDEN_ESTADOS: EstadoPedido[] = [
  'PENDIENTE',
  'CONFIRMADO',
  'EN_CAMINO',
  'ENTREGADO',
  'CANCELADO',
];

function soles(monto: number) {
  return `S/ ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Abreviado para los ejes: 1.2K en lugar de 1,234.00 */
function solesCorto(monto: number) {
  if (monto >= 1000) return `${(monto / 1000).toFixed(monto >= 10000 ? 0 : 1)}K`;
  return String(Math.round(monto));
}

/** 'lun 13' a partir de una fecha ISO, sin desfase por zona horaria. */
function diaCorto(iso: string) {
  const [a, m, d] = iso.split('-').map(Number);
  const fecha = new Date(a, m - 1, d);
  return fecha
    .toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' })
    .replace('.', '');
}

function fechaLarga(iso: string) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Redondea el tope del eje a un número limpio, para que las marcas sean legibles. */
function topeLimpio(max: number) {
  if (max <= 0) return 100;
  const magnitud = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / magnitud) * magnitud;
}

interface Props {
  /** Permite al dashboard mandar al usuario a la pestaña que resuelve cada alerta. */
  onIrA: (vista: 'inventario' | 'pedidos' | 'recetas' | 'reportes') => void;
}

export function DashboardGerente({ onIrA }: Props) {
  const [ventas, setVentas] = useState<VentasPorPeriodo[]>([]);
  const [estados, setEstados] = useState<PedidosPorEstado[]>([]);
  const [masVendidos, setMasVendidos] = useState<ProductoMasVendido[]>([]);
  const [stockBajo, setStockBajo] = useState<StockBajo[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [diaActivo, setDiaActivo] = useState<string | null>(null);

  useEffect(() => {
    const semana = rangoUltimosDias(7);
    const mes = rangoUltimosDias(30);

    // Todo en paralelo: son cinco consultas independientes.
    Promise.all([
      reportesApi.ventas(semana.desde, semana.hasta),
      reportesApi.pedidosPorEstado(mes.desde, mes.hasta),
      reportesApi.productosMasVendidos(mes.desde, mes.hasta, 5),
      reportesApi.stockBajo(10),
      // Un empleado sí puede ver recetas; si algún día no, el panel no se cae.
      recetasAdminApi.pendientes().catch(() => [] as Receta[]),
    ])
      .then(([v, e, mv, sb, rc]) => {
        setVentas(v);
        setEstados(e);
        setMasVendidos(mv);
        setStockBajo(sb);
        setRecetas(rc);
      })
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar el resumen')))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <p className="panel-cargando">Cargando resumen…</p>;
  }

  const serie = serieCompleta(ventas, 7);
  const ventasSemana = serie.reduce((t, d) => t + d.monto, 0);
  const pedidosSemana = serie.reduce((t, d) => t + d.cantidadPedidos, 0);
  const maxMonto = Math.max(...serie.map((d) => d.monto), 0);
  const tope = topeLimpio(maxMonto);
  const pico = serie.reduce((a, b) => (b.monto > a.monto ? b : a), serie[0]);

  const pedidosMes = estados.reduce((t, e) => t + e.cantidad, 0);
  const entregados = estados.find((e) => e.estado === 'ENTREGADO')?.cantidad ?? 0;
  const efectividad = pedidosMes > 0 ? Math.round((entregados / pedidosMes) * 100) : 0;
  const porAtender = estados
    .filter((e) => e.estado === 'PENDIENTE' || e.estado === 'CONFIRMADO')
    .reduce((t, e) => t + e.cantidad, 0);

  const maxVendido = Math.max(...masVendidos.map((p) => p.unidadesVendidas), 1);
  // Las marcas del eje, de arriba hacia abajo.
  const marcasY = [1, 0.75, 0.5, 0.25, 0].map((f) => tope * f);

  return (
    <div>
      {error && <div className="panel-aviso">{error}</div>}

      {/* Indicadores. El primero es el número que encabeza el panel. */}
      <div className="kpi-row">
        <div className="kpi kpi-principal">
          <span className="kpi-label">Ventas de los últimos 7 días</span>
          <span className="kpi-valor">{soles(ventasSemana)}</span>
          <span className="kpi-nota">
            {pedidosSemana} {pedidosSemana === 1 ? 'pedido' : 'pedidos'} en la semana
          </span>
        </div>

        <div className="kpi">
          <span className="kpi-label">Pedidos del mes</span>
          <span className="kpi-valor">{pedidosMes}</span>
          <span className="kpi-nota">{efectividad}% entregados</span>
        </div>

        <div className="kpi">
          <span className="kpi-label">Pedidos por atender</span>
          <span className="kpi-valor">{porAtender}</span>
          <span className={`kpi-nota${porAtender > 0 ? ' es-alerta' : ''}`}>
            {porAtender > 0 ? 'Pendientes o confirmados' : 'Todo al día'}
          </span>
        </div>

        <div className="kpi">
          <span className="kpi-label">Productos por agotar</span>
          <span className="kpi-valor">{stockBajo.length}</span>
          <span className={`kpi-nota${stockBajo.length > 0 ? ' es-alerta' : ''}`}>
            {stockBajo.length > 0 ? 'Requieren reposición' : 'Stock saludable'}
          </span>
        </div>
      </div>

      <div className="panel-grid dos-columnas">
        {/* Gráfico de ventas. Una sola serie: el título dice qué se mide, sin leyenda. */}
        <section className="panel">
          <h2 className="panel-titulo">Ventas por día</h2>
          <p className="panel-sub">
            Últimos 7 días, en soles. {maxMonto > 0 && `Mejor día: ${fechaLarga(pico.dia)}.`}
          </p>

          {maxMonto === 0 ? (
            <p className="panel-vacio">
              Todavía no hay ventas registradas en los últimos 7 días.
            </p>
          ) : (
            <div className="gr">
              <div className="gr-eje-y" aria-hidden="true">
                {marcasY.map((v, i) => (
                  <span key={i}>{solesCorto(v)}</span>
                ))}
              </div>

              <div>
                <div className="gr-area">
                  <div className="gr-rejilla" aria-hidden="true">
                    {marcasY.map((_, i) => (
                      <span key={i} />
                    ))}
                  </div>

                  <div className="gr-columnas">
                    {serie.map((d) => {
                      const alto = tope > 0 ? (d.monto / tope) * 100 : 0;
                      const esPico = d.dia === pico.dia && d.monto > 0;
                      return (
                        <div
                          key={d.dia}
                          className="gr-col"
                          onMouseEnter={() => setDiaActivo(d.dia)}
                          onMouseLeave={() => setDiaActivo(null)}
                        >
                          {diaActivo === d.dia && (
                            <div className="gr-tip" role="tooltip">
                              {fechaLarga(d.dia)}
                              <br />
                              <b>{soles(d.monto)}</b> · {d.cantidadPedidos}{' '}
                              {d.cantidadPedidos === 1 ? 'pedido' : 'pedidos'}
                            </div>
                          )}
                          {esPico && <span className="gr-valor-pico">{soles(d.monto)}</span>}
                          <div className="gr-barra" style={{ height: `${alto}%` }} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="gr-eje-x">
                  {serie.map((d) => (
                    <span key={d.dia}>{diaCorto(d.dia)}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Reparto de pedidos por estado. Punto de color + nombre escrito. */}
        <section className="panel">
          <h2 className="panel-titulo">Pedidos por estado</h2>
          <p className="panel-sub">Últimos 30 días</p>

          {pedidosMes === 0 ? (
            <p className="panel-vacio">No hay pedidos en el último mes.</p>
          ) : (
            <div className="estados">
              {ORDEN_ESTADOS.map((est) => {
                const dato = estados.find((e) => e.estado === est);
                if (!dato || dato.cantidad === 0) return null;
                return (
                  <div key={est} className="estado-fila">
                    <span className="estado-nombre">
                      <span
                        className="estado-punto"
                        style={{ background: COLOR_ESTADO[est] }}
                        aria-hidden="true"
                      />
                      {NOMBRE_ESTADO[est]}
                    </span>
                    <span className="estado-cifras">
                      <b>{dato.cantidad}</b>
                      <span>{soles(dato.monto)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="panel-grid dos-columnas">
        {/* Más vendidos, con barra proporcional de la misma rampa que el gráfico. */}
        <section className="panel">
          <h2 className="panel-titulo">Productos más vendidos</h2>
          <p className="panel-sub">Últimos 30 días, por unidades</p>

          {masVendidos.length === 0 ? (
            <p className="panel-vacio">Aún no hay ventas que medir.</p>
          ) : (
            <table className="mini-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ width: 110 }}>Unidades</th>
                  <th className="num">Monto</th>
                </tr>
              </thead>
              <tbody>
                {masVendidos.map((p) => (
                  <tr key={p.idProducto}>
                    <td>{p.nombreProducto}</td>
                    <td>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        title={`${p.unidadesVendidas} unidades`}
                      >
                        <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 22 }}>
                          {p.unidadesVendidas}
                        </span>
                        <span className="barra-prop-pista">
                          <span
                            className="barra-prop"
                            style={{
                              display: 'block',
                              width: `${(p.unidadesVendidas / maxVendido) * 100}%`,
                            }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="num">{soles(p.montoTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Lo que requiere acción: stock bajo y recetas esperando revisión. */}
        <section className="panel">
          <h2 className="panel-titulo">Requiere tu atención</h2>
          <p className="panel-sub">Stock por agotar y recetas sin revisar</p>

          {stockBajo.length === 0 && recetas.length === 0 ? (
            <p className="panel-vacio">Nada pendiente. Todo en orden.</p>
          ) : (
            <>
              {recetas.length > 0 && (
                <div style={{ marginBottom: stockBajo.length > 0 ? 20 : 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      {recetas.length} {recetas.length === 1 ? 'receta' : 'recetas'} por revisar
                    </strong>
                    <button className="btn-chico" onClick={() => onIrA('recetas')}>
                      Revisar
                    </button>
                  </div>
                  <table className="mini-tabla">
                    <tbody>
                      {recetas.slice(0, 3).map((r) => (
                        <tr key={r.id}>
                          <td>{r.nombreProducto}</td>
                          <td style={{ color: 'var(--texto-suave)', fontSize: 12 }}>
                            {r.codigoPedido}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {stockBajo.length > 0 && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      {stockBajo.length} {stockBajo.length === 1 ? 'producto' : 'productos'} con
                      stock bajo
                    </strong>
                    <button className="btn-chico" onClick={() => onIrA('inventario')}>
                      Reponer
                    </button>
                  </div>
                  <table className="mini-tabla">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th className="num">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockBajo.slice(0, 6).map((p) => (
                        <tr key={p.idProducto}>
                          <td>{p.nombre}</td>
                          <td style={{ color: 'var(--texto-suave)', fontSize: 12 }}>
                            {p.categoria}
                          </td>
                          <td className="num">
                            <span
                              className={`badge ${p.stock === 0 ? 'badge-red' : 'badge-yellow'}`}
                            >
                              {p.stock === 0 ? 'Agotado' : p.stock}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

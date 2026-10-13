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
import type { EstadoPedido } from '../api/pedidos';
import { serieCompleta } from '../shared/serieVentas';
import '../Css/Dashboard.css';

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

function soles(m: number) {
  return `S/ ${m.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function solesCorto(m: number) {
  if (m >= 1000) return `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)}K`;
  return String(Math.round(m));
}

function fechaLarga(iso: string) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function diaCorto(iso: string) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
    .replace('.', '');
}

function topeLimpio(max: number) {
  if (max <= 0) return 100;
  const magnitud = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / magnitud) * magnitud;
}

export function ReportesGerente() {
  const [dias, setDias] = useState(7);
  const [umbral, setUmbral] = useState(10);

  const [ventas, setVentas] = useState<VentasPorPeriodo[]>([]);
  const [estados, setEstados] = useState<PedidosPorEstado[]>([]);
  const [masVendidos, setMasVendidos] = useState<ProductoMasVendido[]>([]);
  const [stockBajo, setStockBajo] = useState<StockBajo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [diaActivo, setDiaActivo] = useState<string | null>(null);
  const [verTabla, setVerTabla] = useState(false);

  useEffect(() => {
    const { desde, hasta } = rangoUltimosDias(dias);
    setCargando(true);
    setError('');
    Promise.all([
      reportesApi.ventas(desde, hasta),
      reportesApi.pedidosPorEstado(desde, hasta),
      reportesApi.productosMasVendidos(desde, hasta, 10),
      reportesApi.stockBajo(umbral),
    ])
      .then(([v, e, mv, sb]) => {
        setVentas(v);
        setEstados(e);
        setMasVendidos(mv);
        setStockBajo(sb);
      })
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar los reportes')))
      .finally(() => setCargando(false));
  }, [dias, umbral]);

  const serie = serieCompleta(ventas, dias);

  const total = serie.reduce((t, d) => t + d.monto, 0);
  const totalPedidos = serie.reduce((t, d) => t + d.cantidadPedidos, 0);
  const promedio = totalPedidos > 0 ? total / totalPedidos : 0;
  const maxMonto = Math.max(...serie.map((d) => d.monto), 0);
  const tope = topeLimpio(maxMonto);
  const pico = serie.reduce((a, b) => (b.monto > a.monto ? b : a), serie[0]);
  const marcasY = [1, 0.75, 0.5, 0.25, 0].map((f) => tope * f);
  const maxVendido = Math.max(...masVendidos.map((p) => p.unidadesVendidas), 1);

  return (
    <div>
      {error && <div className="panel-aviso">{error}</div>}

      <div className="filtros-barra">
        <label htmlFor="rango">Periodo</label>
        <select id="rango" value={dias} onChange={(e) => setDias(Number(e.target.value))}>
          <option value={7}>Últimos 7 días</option>
          <option value={15}>Últimos 15 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
        </select>
        <label htmlFor="umbral">Avisar con stock menor o igual a</label>
        <select id="umbral" value={umbral} onChange={(e) => setUmbral(Number(e.target.value))}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      {cargando ? (
        <p className="panel-cargando">Cargando reportes…</p>
      ) : (
        <>
          <div className="kpi-row">
            <div className="kpi kpi-principal">
              <span className="kpi-label">Ventas del periodo</span>
              <span className="kpi-valor">{soles(total)}</span>
              <span className="kpi-nota">Últimos {dias} días</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Pedidos</span>
              <span className="kpi-valor">{totalPedidos}</span>
              <span className="kpi-nota">En el mismo periodo</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Ticket promedio</span>
              <span className="kpi-valor">{soles(promedio)}</span>
              <span className="kpi-nota">Por pedido</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Productos por agotar</span>
              <span className="kpi-valor">{stockBajo.length}</span>
              <span className={`kpi-nota${stockBajo.length > 0 ? ' es-alerta' : ''}`}>
                Stock ≤ {umbral}
              </span>
            </div>
          </div>

          <div className="panel-grid dos-columnas">
            <section className="panel">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div>
                  <h2 className="panel-titulo">Ventas por día</h2>
                  <p className="panel-sub">
                    En soles.{' '}
                    {maxMonto > 0 ? `Mejor día: ${fechaLarga(pico.dia)}.` : 'Sin ventas aún.'}
                  </p>
                </div>
                <button className="btn-chico" onClick={() => setVerTabla((v) => !v)}>
                  {verTabla ? 'Ver gráfico' : 'Ver tabla'}
                </button>
              </div>

              {maxMonto === 0 ? (
                <p className="panel-vacio">No hay ventas en el periodo elegido.</p>
              ) : verTabla ? (
                /* Misma información en tabla: el gráfico nunca es la única vía. */
                <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                  <table className="mini-tabla">
                    <thead>
                      <tr>
                        <th>Día</th>
                        <th className="num">Operaciones</th>
                        <th className="num">Tienda</th>
                        <th className="num">Web</th>
                        <th className="num">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...serie].reverse().map((d) => (
                        <tr key={d.dia}>
                          <td>{fechaLarga(d.dia)}</td>
                          <td className="num">{d.cantidadPedidos}</td>
                          <td className="num">{soles(d.montoPresencial)}</td>
                          <td className="num">{soles(d.monto - d.montoPresencial)}</td>
                          <td className="num">{soles(d.monto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                        {serie.map((d) => (
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
                                {d.cantidadPedidos === 1 ? 'operación' : 'operaciones'}
                                {d.montoPresencial > 0 && (
                                  <>
                                    <br />
                                    Tienda {soles(d.montoPresencial)} · Web{' '}
                                    {soles(d.monto - d.montoPresencial)}
                                  </>
                                )}
                              </div>
                            )}
                            {d.dia === pico.dia && d.monto > 0 && dias <= 15 && (
                              <span className="gr-valor-pico">{soles(d.monto)}</span>
                            )}
                            <div
                              className="gr-barra"
                              style={{ height: `${tope > 0 ? (d.monto / tope) * 100 : 0}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Con muchos días las etiquetas no caben: se muestran salteadas. */}
                    <div className="gr-eje-x">
                      {serie.map((d, i) => (
                        <span key={d.dia}>
                          {dias <= 15 || i % Math.ceil(dias / 10) === 0 ? diaCorto(d.dia) : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="panel">
              <h2 className="panel-titulo">Pedidos por estado</h2>
              <p className="panel-sub">Últimos {dias} días</p>
              {estados.length === 0 ? (
                <p className="panel-vacio">No hay pedidos en el periodo.</p>
              ) : (
                <div className="estados">
                  {(Object.keys(NOMBRE_ESTADO) as EstadoPedido[]).map((est) => {
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
            <section className="panel">
              <h2 className="panel-titulo">Productos más vendidos</h2>
              <p className="panel-sub">Por unidades, en los últimos {dias} días</p>
              {masVendidos.length === 0 ? (
                <p className="panel-vacio">Sin ventas que medir en el periodo.</p>
              ) : (
                <table className="mini-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style={{ width: 120 }}>Unidades</th>
                      <th className="num">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masVendidos.map((p) => (
                      <tr key={p.idProducto}>
                        <td>{p.nombreProducto}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 24 }}>
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

            <section className="panel">
              <h2 className="panel-titulo">Stock por agotar</h2>
              <p className="panel-sub">Productos con {umbral} unidades o menos</p>
              {stockBajo.length === 0 ? (
                <p className="panel-vacio">Ningún producto está por agotarse.</p>
              ) : (
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  <table className="mini-tabla">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th className="num">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockBajo.map((p) => (
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
            </section>
          </div>
        </>
      )}
    </div>
  );
}

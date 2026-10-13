import { useEffect, useState } from 'react';
import { mensajeDeError } from '../../api/client';
import {
  etiquetaMetodo,
  METODOS_PAGO,
  soles,
  ventasApi,
  type ResumenCaja,
  type Venta,
} from '../../api/ventas';
import { hoyISO } from '../../shared/fechas';
import { Ticket } from './Ticket';

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  esGerente: boolean;
  /** Cambia cada vez que se registra una venta, para recargar. */
  version: number;
  onCambio: () => void;
}

export function VentasDelDia({ esGerente, version, onCambio }: Props) {
  const [fecha, setFecha] = useState(hoyISO());
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [caja, setCaja] = useState<ResumenCaja | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [viendo, setViendo] = useState<Venta | null>(null);
  const [anulando, setAnulando] = useState<Venta | null>(null);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setCargando(true);
    setError('');
    Promise.all([ventasApi.delDia(fecha), ventasApi.resumen(fecha)])
      .then(([v, c]) => {
        setVentas(v);
        setCaja(c);
      })
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar las ventas')))
      .finally(() => setCargando(false));
  }, [fecha, version]);

  async function confirmarAnulacion() {
    if (!anulando) return;
    if (motivo.trim().length < 10) {
      setErrorMotivo('Explica el motivo con al menos 10 caracteres: queda en el registro.');
      return;
    }
    setGuardando(true);
    setErrorMotivo('');
    try {
      const actualizada = await ventasApi.anular(anulando.id, motivo.trim());
      setAnulando(null);
      setMotivo('');
      setViendo(actualizada);
      onCambio();
    } catch (err) {
      setErrorMotivo(mensajeDeError(err, 'No se pudo anular la venta'));
    } finally {
      setGuardando(false);
    }
  }

  const esHoy = fecha === hoyISO();

  return (
    <div>
      {error && <div className="panel-aviso">{error}</div>}

      <div className="filtros-barra">
        <label htmlFor="pv-fecha">Día</label>
        <input
          id="pv-fecha"
          type="date"
          value={fecha}
          max={hoyISO()}
          onChange={(e) => e.target.value && setFecha(e.target.value)}
        />
        {!esHoy && (
          <button className="btn-chico" onClick={() => setFecha(hoyISO())}>
            Volver a hoy
          </button>
        )}
        <span style={{ fontSize: 12.5, color: 'var(--texto-suave)', marginLeft: 'auto' }}>
          {esGerente ? 'Caja de todo el personal' : 'Tu caja: solo tus ventas'}
        </span>
      </div>

      {caja && (
        <div className="pv-caja">
          <div className="pv-caja-tile principal">
            <span>Total vendido</span>
            <b>{soles(caja.totalVendido)}</b>
            <small>
              {caja.cantidadVentas} {caja.cantidadVentas === 1 ? 'venta' : 'ventas'}
            </small>
          </div>
          <div className="pv-caja-tile">
            <span>Efectivo en caja</span>
            <b>{soles(caja.efectivoEnCaja)}</b>
            <small>Con el vuelto ya descontado</small>
          </div>
          {METODOS_PAGO.filter((m) => m.valor !== 'EFECTIVO').map((m) => (
            <div key={m.valor} className="pv-caja-tile">
              <span>{m.etiqueta}</span>
              <b>{soles(caja.totalPorMetodo[m.valor] ?? 0)}</b>
              <small>
                {caja.cantidadPorMetodo[m.valor] ?? 0}{' '}
                {(caja.cantidadPorMetodo[m.valor] ?? 0) === 1 ? 'operación' : 'operaciones'}
              </small>
            </div>
          ))}
          {caja.cantidadAnuladas > 0 && (
            <div className="pv-caja-tile">
              <span>Anuladas</span>
              <b>{caja.cantidadAnuladas}</b>
              <small>{soles(caja.montoAnulado)} no cuentan en caja</small>
            </div>
          )}
        </div>
      )}

      <div className="table-card">
        {cargando ? (
          <p className="panel-cargando">Cargando ventas…</p>
        ) : ventas.length === 0 ? (
          <p className="panel-vacio">
            {esHoy ? 'Todavía no hay ventas hoy.' : 'No hubo ventas ese día.'}
          </p>
        ) : (
          <>
            <div className="tabla-scroll">
            <table className="data-table ajustada">
              <thead>
                <tr>
                  <th>Venta</th>
                  <th>Hora</th>
                  {esGerente && <th>Vendedor</th>}
                  <th>Productos</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id} className={v.anulada ? 'pv-fila-anulada' : ''}>
                    <td>
                      <strong>{v.codigoVenta}</strong>
                      {v.clienteNombre && (
                        <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{v.clienteNombre}</div>
                      )}
                    </td>
                    <td>{hora(v.fechaVenta)}</td>
                    {esGerente && <td>{v.vendidoPor}</td>}
                    <td>
                      {v.cantidadItems} {v.cantidadItems === 1 ? 'unidad' : 'unidades'}
                    </td>
                    <td>{etiquetaMetodo(v.metodoPago)}</td>
                    <td>{soles(v.total)}</td>
                    <td>
                      <span className={`badge ${v.anulada ? 'badge-red' : 'badge-green'}`}>
                        {v.anulada ? 'Anulada' : 'Cobrada'}
                      </span>
                    </td>
                    <td>
                      <div className="acciones-fila">
                        <button className="btn-chico" onClick={() => setViendo(v)}>
                          Ver ticket
                        </button>
                        {esGerente && !v.anulada && (
                          <button
                            className="btn-chico es-rojo"
                            onClick={() => {
                              setAnulando(v);
                              setMotivo('');
                              setErrorMotivo('');
                            }}
                          >
                            Anular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="table-footer">
              {ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'}
              {caja && caja.cantidadAnuladas > 0 && ` · ${caja.cantidadAnuladas} anulada(s)`}
            </div>
          </>
        )}
      </div>

      {viendo && (
        <div className="modal-overlay" onClick={() => setViendo(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{viendo.codigoVenta}</h2>
                <p className="modal-subtitle">
                  {viendo.anulada ? 'Venta anulada' : `Cobrada por ${viendo.vendidoPor}`}
                </p>
              </div>
              <button className="modal-close" onClick={() => setViendo(null)} aria-label="Cerrar">
                ×
              </button>
            </div>
            <Ticket venta={viendo} />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setViendo(null)}>
                Cerrar
              </button>
              <button className="btn-save" onClick={() => window.print()}>
                <i className="fa-solid fa-print"></i> Reimprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {anulando && (
        <div className="modal-overlay" onClick={() => !guardando && setAnulando(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Anular {anulando.codigoVenta}</h2>
                <p className="modal-subtitle">
                  {soles(anulando.total)} · {etiquetaMetodo(anulando.metodoPago)} ·{' '}
                  {anulando.vendidoPor}
                </p>
              </div>
              <button className="modal-close" onClick={() => setAnulando(null)} aria-label="Cerrar">
                ×
              </button>
            </div>

            {errorMotivo && <div className="modal-error">{errorMotivo}</div>}

            <p style={{ fontSize: 13, color: 'var(--texto-suave)', marginBottom: 12 }}>
              Los productos vuelven al stock y la venta deja de contar en caja y en reportes. No se
              borra: queda registrada como anulada, con tu nombre y el motivo.
            </p>
            {anulando.metodoPago !== 'EFECTIVO' && (
              <p className="pv-aviso-pci" style={{ marginTop: 0, marginBottom: 12 }}>
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                <span>
                  Anular aquí no devuelve el dinero: el reembolso de {etiquetaMetodo(anulando.metodoPago)}{' '}
                  se hace aparte.
                </span>
              </p>
            )}

            <div className="form-field">
              <label htmlFor="pv-motivo">Motivo *</label>
              <textarea
                id="pv-motivo"
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej.: El cliente devolvió el producto sin abrir"
                maxLength={255}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--borde)',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setAnulando(null)} disabled={guardando}>
                Cancelar
              </button>
              <button
                className="btn-save"
                onClick={confirmarAnulacion}
                disabled={guardando}
                style={{ background: '#b91c1c' }}
              >
                {guardando ? 'Anulando…' : 'Anular venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

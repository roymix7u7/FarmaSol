import { useEffect, useState } from 'react';
import { mensajeDeError } from '../api/client';
import {
  pedidosAdminApi,
  SIGUIENTES_ESTADOS,
  type EstadoPedido,
  type PedidoCompleto,
  type PedidoResumen,
} from '../api/pedidos';
import '../Css/Dashboard.css';

const ESTADOS: { valor: EstadoPedido; texto: string; clase: string }[] = [
  { valor: 'PENDIENTE', texto: 'Pendiente', clase: 'badge-yellow' },
  { valor: 'CONFIRMADO', texto: 'Confirmado', clase: 'badge-blue' },
  { valor: 'EN_CAMINO', texto: 'En camino', clase: 'badge-yellow' },
  { valor: 'ENTREGADO', texto: 'Entregado', clase: 'badge-green' },
  { valor: 'CANCELADO', texto: 'Cancelado', clase: 'badge-red' },
];

function infoEstado(estado: EstadoPedido) {
  return ESTADOS.find((e) => e.valor === estado) ?? ESTADOS[0];
}

function soles(m: number) {
  return `S/ ${m.toFixed(2)}`;
}

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PedidosGerente() {
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | ''>('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [detalle, setDetalle] = useState<PedidoCompleto | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [cambiando, setCambiando] = useState(false);

  // Estados para el modal de cancelación
  const [cancelando, setCancelando] = useState<PedidoCompleto | null>(null);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');

  function cargar() {
    setCargando(true);
    setError('');
    pedidosAdminApi
      .listar(filtroEstado || undefined)
      .then(setPedidos)
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar los pedidos')))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [filtroEstado]);

  async function verDetalle(id: number) {
    setCargandoDetalle(true);
    setError('');
    try {
      setDetalle(await pedidosAdminApi.obtener(id));
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo abrir el pedido'));
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function cambiarEstado(id: number, nuevo: EstadoPedido, motivoCancelacion?: string) {
    setCambiando(true);
    setError('');
    setErrorMotivo('');
    try {
      const actualizado = await pedidosAdminApi.cambiarEstado(id, nuevo, motivoCancelacion);
      setDetalle(actualizado);
      setCancelando(null); // Cierra la ventana modal de cancelación
      cargar();
    } catch (err) {
      if (nuevo === 'CANCELADO') {
        setErrorMotivo(mensajeDeError(err, 'No se pudo cancelar el pedido'));
      } else {
        setError(mensajeDeError(err, 'No se pudo cambiar el estado'));
      }
    } finally {
      setCambiando(false);
    }
  }

  function confirmarCancelacion() {
    if (!cancelando) return;
    if (motivo.trim().length < 10) {
      setErrorMotivo('Explica el motivo con al menos 10 caracteres para que el cliente sepa qué pasó.');
      return;
    }
    cambiarEstado(cancelando.id, 'CANCELADO', motivo.trim());
  }

  const termino = busqueda.trim().toLowerCase();
  const visibles = termino
    ? pedidos.filter(
        (p) =>
          p.codigoPedido.toLowerCase().includes(termino) ||
          p.nombreCliente.toLowerCase().includes(termino),
      )
    : pedidos;

  return (
    <div>
      {error && <div className="panel-aviso">{error}</div>}

      <div className="filtros-barra">
        <input
          type="text"
          placeholder="Buscar por N° de orden o cliente…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <label htmlFor="filtro-estado">Estado</label>
        <select
          id="filtro-estado"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as EstadoPedido | '')}
        >
          <option value="">Todos</option>
          {ESTADOS.map((e) => (
            <option key={e.valor} value={e.valor}>
              {e.texto}
            </option>
          ))}
        </select>
        <button className="btn-chico" onClick={cargar} disabled={cargando}>
          Actualizar
        </button>
      </div>

      <div className="table-card">
        {cargando ? (
          <p className="panel-cargando">Cargando pedidos…</p>
        ) : visibles.length === 0 ? (
          <p className="panel-vacio">
            {pedidos.length === 0
              ? 'Todavía no hay pedidos registrados.'
              : 'Ningún pedido coincide con la búsqueda.'}
          </p>
        ) : (
          <>
            <div className="tabla-scroll">
            <table className="data-table ajustada">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => {
                  const est = infoEstado(p.estado);
                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.codigoPedido}</strong>
                        {p.requiereReceta && (
                          <span
                            className="badge badge-yellow"
                            style={{ marginLeft: 7, fontSize: 10 }}
                          >
                            Rx
                          </span>
                        )}
                      </td>
                      <td>{p.nombreCliente}</td>
                      <td>{fecha(p.fechaPedido)}</td>
                      <td>{p.cantidadItems}</td>
                      <td>{soles(p.total)}</td>
                      <td>
                        <span className={`badge ${est.clase}`}>{est.texto}</span>
                      </td>
                      <td>
                        <button className="btn-chico" onClick={() => verDetalle(p.id)}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            <div className="table-footer">
              Mostrando {visibles.length} de {pedidos.length}{' '}
              {pedidos.length === 1 ? 'pedido' : 'pedidos'}
            </div>
          </>
        )}
      </div>

      {/* MODAL DE DETALLE */}
      {(detalle || cargandoDetalle) && (
        <div className="modal-overlay" onClick={() => !cambiando && setDetalle(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {cargandoDetalle || !detalle ? (
              <p className="panel-cargando">Cargando pedido…</p>
            ) : (
              <>
                <div className="modal-header">
                  <div>
                    <h2 className="modal-title">{detalle.codigoPedido}</h2>
                    <p className="modal-subtitle">
                      {detalle.nombreCliente} · {fecha(detalle.fechaPedido)}
                    </p>
                  </div>
                  <button className="modal-close" onClick={() => setDetalle(null)}>
                    ×
                  </button>
                </div>

                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${infoEstado(detalle.estado).clase}`}>
                    {infoEstado(detalle.estado).texto}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--texto-suave)' }}>
                    {detalle.tipoEntrega === 'DELIVERY' ? 'Envío a domicilio' : 'Retiro en botica'}
                  </span>
                </div>

                {SIGUIENTES_ESTADOS[detalle.estado].length > 0 ? (
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 12.5, color: 'var(--texto-suave)', marginBottom: 7 }}>
                      Cambiar estado a:
                    </p>
                    <div className="acciones-fila">
                      {SIGUIENTES_ESTADOS[detalle.estado].map((siguiente) => (
                        <button
                          key={siguiente}
                          className={`btn-chico ${siguiente === 'CANCELADO' ? 'es-rojo' : 'es-verde'}`}
                          disabled={cambiando}
                          onClick={() => {
                            if (siguiente === 'CANCELADO') {
                              setCancelando(detalle);
                              setMotivo('');
                              setErrorMotivo('');
                            } else {
                              cambiarEstado(detalle.id, siguiente);
                            }
                          }}
                        >
                          {cambiando ? 'Guardando…' : infoEstado(siguiente).texto}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12.5, color: 'var(--texto-suave)', marginBottom: 18 }}>
                    Este pedido ya está cerrado: no admite más cambios de estado.
                  </p>
                )}

                <h3 style={{ fontSize: 14, margin: '0 0 10px' }}>Productos</h3>
                <table className="mini-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="num">Cant.</th>
                      <th className="num">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.detalles.map((d) => (
                      <tr key={d.idPedidoDetalle}>
                        <td>
                          {d.nombreProducto}
                          {d.requiereReceta && (
                            <span
                              className={`badge ${d.estadoReceta === 'APROBADA' ? 'badge-green' : d.estadoReceta === 'RECHAZADA' ? 'badge-red' : 'badge-yellow'}`}
                              style={{ marginLeft: 7, fontSize: 10 }}
                            >
                              {d.estadoReceta === 'APROBADA'
                                ? 'Receta OK'
                                : d.estadoReceta === 'RECHAZADA'
                                  ? 'Receta rechazada'
                                  : d.estadoReceta === 'PENDIENTE_REVISION'
                                    ? 'Receta en revisión'
                                    : 'Sin receta'}
                            </span>
                          )}
                        </td>
                        <td className="num">{d.cantidad}</td>
                        <td className="num">{soles(d.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: 16, textAlign: 'right', fontSize: 13.5 }}>
                  <div style={{ color: 'var(--texto-suave)' }}>
                    Subtotal: {soles(detalle.subtotal)}
                  </div>
                  {detalle.descuentoTotal > 0 && (
                    <div style={{ color: 'var(--verde)' }}>
                      Descuentos: −{soles(detalle.descuentoTotal)}
                    </div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: 16, marginTop: 6 }}>
                    Total: {soles(detalle.total)}
                  </div>
                </div>

                <h3 style={{ fontSize: 14, margin: '20px 0 8px' }}>Entrega</h3>
                <div style={{ fontSize: 13, color: 'var(--texto-suave)', lineHeight: 1.7 }}>
                  {detalle.tipoEntrega === 'DELIVERY' ? (
                    <>
                      <div>Recibe: {detalle.envioQuienRecibe ?? '—'}</div>
                      <div>Teléfono: {detalle.envioTelefono ?? '—'}</div>
                      <div>
                        Dirección: {detalle.envioDireccion ?? '—'}
                        {detalle.envioDistrito ? `, ${detalle.envioDistrito}` : ''}
                      </div>
                      {detalle.envioReferencia && <div>Referencia: {detalle.envioReferencia}</div>}
                    </>
                  ) : (
                    <>
                      <div>Sede: {detalle.recojoSede ?? '—'}</div>
                      <div>Retira: {detalle.recojoNombre ?? '—'}</div>
                      <div>DNI: {detalle.recojoDni ?? '—'}</div>
                    </>
                  )}
                </div>

                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setDetalle(null)}>
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CANCELAR PEDIDO (CON MOTIVO) */}
      {cancelando && (
        <div className="modal-overlay" onClick={() => !cambiando && setCancelando(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Cancelar pedido</h2>
                <p className="modal-subtitle">
                  {cancelando.codigoPedido} · {cancelando.nombreCliente}
                </p>
              </div>
              <button className="modal-close" onClick={() => setCancelando(null)}>
                ×
              </button>
            </div>

            {errorMotivo && <div className="modal-error">{errorMotivo}</div>}

            <div className="form-field">
              <label htmlFor="motivo-cancelacion">Motivo de la cancelación *</label>
              <textarea
                id="motivo-cancelacion"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={4}
                placeholder="Ej.: El producto se quedó sin stock, o el cliente solicitó cancelar la compra."
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

            <p style={{ fontSize: 12.5, color: 'var(--texto-suave)', marginTop: 8 }}>
              El cliente verá este mensaje en su panel de "Mis Pedidos".
            </p>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setCancelando(null)}
                disabled={cambiando}
              >
                Volver
              </button>
              <button
                className="btn-save"
                onClick={confirmarCancelacion}
                disabled={cambiando}
                style={{ background: '#b91c1c' }}
              >
                {cambiando ? 'Cancelando…' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
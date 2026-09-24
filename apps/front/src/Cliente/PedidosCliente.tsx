import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pedidosApi, type PedidoResumen, type PedidoCompleto, type EstadoPedido } from '../api/pedidos';
import { clientesApi, type ClientePerfil } from '../api/clientes';
import { mensajeDeError } from '../api/client';
import { SubirReceta } from '../shared/SubirReceta';

// ============ ESTILOS DE ESTADO ============
const estadoConfig: Record<EstadoPedido, { texto: string; bg: string; color: string }> = {
  PENDIENTE: { texto: 'Pendiente', bg: '#fef3c7', color: '#b45309' },
  CONFIRMADO: { texto: 'Confirmado', bg: '#dbeafe', color: '#1d4ed8' },
  EN_CAMINO: { texto: 'En camino', bg: '#fef3c7', color: '#b45309' },
  ENTREGADO: { texto: 'Entregado', bg: '#d1fae5', color: '#047857' },
  CANCELADO: { texto: 'Cancelado', bg: '#fee2e2', color: '#b91c1c' },
};

function formatoFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PedidosCliente() {
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState<ClientePerfil | null>(null);
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
  const [detalle, setDetalle] = useState<PedidoCompleto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      clientesApi.miPerfil().catch(() => null),
      pedidosApi.misPedidos().catch(() => []),
    ])
      .then(([p, l]) => {
        setPerfil(p);
        setPedidos(l);
      })
      .finally(() => setCargando(false));
  }, []);

  async function verDetalle(idPedido: number) {
    setError('');
    setCargandoDetalle(true);
    try {
      const d = await pedidosApi.miPedido(idPedido);
      setDetalle(d);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo cargar el detalle del pedido'));
    } finally {
      setCargandoDetalle(false);
    }
  }

  if (cargando) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--texto-suave)' }}>
        Cargando pedidos…
      </div>
    );
  }

  const inicial = (perfil?.nombres?.charAt(0) || 'C').toUpperCase();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* ============ SIDEBAR ============ */}
        <aside>
          <div
            style={{
              background: 'var(--blanco)',
              border: '1px solid var(--borde)',
              borderRadius: 12,
              padding: '28px 20px',
              textAlign: 'center',
              boxShadow: 'var(--sombra)',
              position: 'sticky',
              top: 24,
            }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: 'var(--verde)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                fontSize: 38,
                fontWeight: 700,
              }}
            >
              {inicial}
            </div>
            <h2 style={{ fontSize: 17, marginBottom: 4 }}>
              {perfil ? `${perfil.nombres} ${perfil.apellidos}` : 'Cliente'}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: 'var(--texto-suave)',
                marginBottom: 24,
                wordBreak: 'break-all',
              }}
            >
              {perfil?.correo}
            </p>

            <button
              type="button"
              onClick={() => navigate('/mi-perfil')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 16px',
                marginBottom: 8,
                borderRadius: 8,
                border: '1px solid var(--borde)',
                background: 'var(--blanco)',
                color: 'var(--texto)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <i className="fa-solid fa-user-pen"></i> Mi Perfil
            </button>

            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--verde)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <i className="fa-solid fa-box"></i> Mis Pedidos
            </button>
          </div>
        </aside>

        {/* ============ CONTENIDO ============ */}
        <main>
          <div
            style={{
              background: 'var(--blanco)',
              border: '1px solid var(--borde)',
              borderRadius: 12,
              padding: 30,
              boxShadow: 'var(--sombra)',
            }}
          >
            <h1 style={{ fontSize: 22, marginBottom: 6 }}>Mis Pedidos</h1>
            <p style={{ fontSize: 14, color: 'var(--texto-suave)', marginBottom: 24 }}>
              Revisa el estado, la fecha e historial de compras de FarmaSol
            </p>

            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '12px 16px',
                  borderRadius: 8,
                  marginBottom: 20,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            {pedidos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--texto-suave)' }}>
                <i className="fa-solid fa-box-open" style={{ fontSize: 48, marginBottom: 12 }}></i>
                <p style={{ fontSize: 15, marginBottom: 16 }}>
                  Aún no tienes pedidos registrados.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    padding: '10px 24px',
                    background: 'var(--verde)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Ir a comprar
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {pedidos.map((p) => {
                  const cfg = estadoConfig[p.estado];
                  return (
                    <div
                      key={p.id}
                      style={{
                        border: '1px solid var(--borde)',
                        borderRadius: 10,
                        padding: 18,
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 16,
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: 15 }}>
                            Pedido {p.codigoPedido}
                          </span>
                          <span
                            style={{
                              background: cfg.bg,
                              color: cfg.color,
                              fontSize: 11.5,
                              fontWeight: 600,
                              padding: '3px 10px',
                              borderRadius: 20,
                            }}
                          >
                            {cfg.texto}
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--texto-suave)', marginBottom: 8 }}>
                          {formatoFecha(p.fechaPedido)}
                        </div>
                        <div style={{ fontSize: 13.5, color: 'var(--texto)' }}>
                          {p.cantidadItems} producto{p.cantidadItems !== 1 ? 's' : ''}
                          {p.requiereReceta && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: 11.5,
                                color: '#b45309',
                                background: '#fef3c7',
                                padding: '2px 8px',
                                borderRadius: 10,
                                fontWeight: 600,
                              }}
                            >
                              Requiere receta
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: 'var(--verde)',
                            marginBottom: 10,
                          }}
                        >
                          S/ {p.total.toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => verDetalle(p.id)}
                          style={{
                            padding: '8px 18px',
                            background: 'var(--verde)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ============ MODAL DE DETALLE ============ */}
      {(detalle || cargandoDetalle) && (
        <div
          onClick={() => setDetalle(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--blanco)',
              borderRadius: 14,
              padding: 28,
              maxWidth: 700,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            {cargandoDetalle || !detalle ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--texto-suave)' }}>
                Cargando detalle…
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                  }}
                >
                  <h2 style={{ fontSize: 20 }}>Pedido {detalle.codigoPedido}</h2>
                  <button
                    type="button"
                    onClick={() => setDetalle(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 20,
                      cursor: 'pointer',
                      color: 'var(--texto-suave)',
                    }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                {/* Info general */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    fontSize: 13.5,
                    marginBottom: 20,
                    padding: 16,
                    background: '#f9fafb',
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <strong>Estado:</strong>{' '}
                    <span
                      style={{
                        background: estadoConfig[detalle.estado].bg,
                        color: estadoConfig[detalle.estado].color,
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {estadoConfig[detalle.estado].texto}
                    </span>
                  </div>
                  <div>
                    <strong>Fecha:</strong> {formatoFecha(detalle.fechaPedido)}
                  </div>
                  <div>
                    <strong>Tipo:</strong>{' '}
                    {detalle.tipoEntrega === 'RECOJO_TIENDA' ? 'Retiro en botica' : 'Delivery'}
                  </div>
                  {detalle.recojoSede && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Sede:</strong> {detalle.recojoSede}
                    </div>
                  )}
                  {detalle.recojoNombre && (
                    <div>
                      <strong>Retira:</strong> {detalle.recojoNombre}
                    </div>
                  )}
                  {detalle.recojoDni && (
                    <div>
                      <strong>DNI:</strong> {detalle.recojoDni}
                    </div>
                  )}
                </div>

                {/* Detalles */}
                <h3 style={{ fontSize: 15, marginBottom: 12 }}>Productos</h3>
                <div style={{ fontSize: 13.5 }}>
                  {detalle.detalles.map((d) => (
                    <div
                      key={d.idPedidoDetalle}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: '1px solid var(--borde)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {d.cantidad}× {d.nombreProducto}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>
                          S/ {d.precioUnitario.toFixed(2)} c/u
                          {d.descuentoUnitario > 0 && (
                            <span style={{ color: 'var(--verde)', marginLeft: 8 }}>
                              (−S/ {d.descuentoUnitario.toFixed(2)})
                            </span>
                          )}
                        </div>
                        {d.requiereReceta && (
                          <SubirReceta
                            idPedidoDetalle={d.idPedidoDetalle}
                            estadoReceta={d.estadoReceta}
                            onSubida={() => verDetalle(detalle.id)}
                          />
                        )}
                      </div>
                      <div style={{ fontWeight: 700 }}>S/ {d.subtotal.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                {/* Totales */}
                <div style={{ marginTop: 20, textAlign: 'right', fontSize: 14 }}>
                  <div style={{ color: 'var(--texto-suave)' }}>
                    Subtotal: S/ {detalle.subtotal.toFixed(2)}
                  </div>
                  {detalle.descuentoTotal > 0 && (
                    <div style={{ color: 'var(--verde)' }}>
                      Descuentos: −S/ {detalle.descuentoTotal.toFixed(2)}
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px dashed var(--borde)',
                      fontSize: 17,
                      fontWeight: 700,
                    }}
                  >
                    Total: <span style={{ color: 'var(--verde)' }}>S/ {detalle.total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
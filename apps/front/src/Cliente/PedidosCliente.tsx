import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pedidosApi, type PedidoCompleto } from '../api/pedidos';
import { api, mensajeDeError } from '../api/client';

export function PedidosCliente() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoCompleto | null>(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  async function cargarPedidos() {
    try {
      const data = await pedidosApi.misPedidos();
      setPedidos(data as any || []);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron cargar tus pedidos'));
    } finally {
      setCargando(false);
    }
  }

 async function descargarPdf(idPedido: number, codigo: string) {
    try {
      const response = await api.get(`/pedidos/${idPedido}/comprobante`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Comprobante-${codigo || idPedido}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('No se pudo descargar el comprobante en PDF');
    }
  }
  

async function verReceta(pedido: PedidoCompleto) {
    try {
      let recetaId = pedido.detalles?.find(d => d.idRecetaVigente)?.idRecetaVigente;

      if (!recetaId) {
        const resRecetas = await api.get(`/pedidos/${pedido.id}/recetas`);
        if (resRecetas.data && resRecetas.data.length > 0) {
          recetaId = resRecetas.data[0].id;
        }
      }

      if (!recetaId) {
        alert('Este pedido aún no tiene un ID de receta digital asociado.');
        return;
      }

      const response = await api.get(`/recetas/${recetaId}/archivo`, { responseType: 'blob' });

      if (!response.data || response.data.size < 10) {
        alert('El archivo de la receta está vacío o no se encontró en el servidor.');
        return;
      }

      // Detectamos el tipo real que responde el backend (image/jpeg o application/pdf)
      const contentType = response.headers['content-type']  as string|| 'image/jpeg';

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank'); // Se abrirá correctamente como imagen en una nueva pestaña
    } catch (err) {
      console.error("Error al abrir la receta:", err);
      alert('No se pudo cargar el archivo de la receta médica desde el servidor.');
    }
  }

  if (cargando) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: '#6b7280', fontSize: 16, fontWeight: 500 }}>
        Cargando tus pedidos...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1150, margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, boxSizing: 'border-box' }}>
      
      {/* Panel Lateral de Usuario */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 20, padding: 28, height: 'fit-content', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
        <div style={{ width: 84, height: 84, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.2)' }}>
          FC
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Frank Cucurella</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, wordBreak: 'break-all' }}>frankcucurella01@gmail.com</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button 
            onClick={() => navigate('/mi-perfil')} 
            style={{ width: '100%', padding: '12px 16px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <span>👤</span> Mi Perfil
          </button>
          <button 
            style={{ width: '100%', padding: '12px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
          >
            <span>📦</span> Mis Pedidos
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Mis Pedidos</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Revisa el estado, la fecha e historial detallado de tus compras en Farmasol.</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '14px 18px', borderRadius: 12, marginBottom: 24, fontSize: 14, fontWeight: 500 }}>
            {error}
          </div>
        )}

        {pedidos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Aún no tienes pedidos registrados</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Explora nuestro catálogo y realiza tu primera compra de forma segura.</p>
            <button onClick={() => navigate('/')} style={{ padding: '12px 28px', background: '#059669', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Ir a la tienda
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {pedidos.map((p) => {
              const esEntregado = p.estado === 'ENTREGADO';
              const esEnCamino = p.estado === 'EN_CAMINO' || p.estado === 'CONFIRMADO';
              const colorBadgeBg = esEntregado ? '#d1fae5' : (esEnCamino ? '#fef3c7' : '#fee2e2');
              const colorBadgeText = esEntregado ? '#065f46' : (esEnCamino ? '#92400e' : '#991b1b');

              return (
                <div key={p.id} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                  
                  {/* Cabecera de la tarjeta */}
                  <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: '#e6f4ea', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#059669' }}>
                        📦
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{p.codigoPedido}</h3>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>Fecha: {new Date(p.fechaPedido).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span style={{ background: colorBadgeBg, color: colorBadgeText, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {p.estado}
                    </span>
                  </div>

                  {/* Cuerpo */}
                  <div style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 8, textTransform: 'uppercase' }}>
                      Resumen del pedido
                    </div>
                    {p.detalles && p.detalles.length > 0 ? (
                      p.detalles.map((d, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, color: '#1f2937' }}>
                          <span>{d.nombreProducto} <span style={{ color: '#6b7280', fontSize: 13 }}>(x{d.cantidad})</span></span>
                          <span style={{ fontWeight: 600 }}>S/ {(d.subtotal || 0).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 14, color: '#4b5563' }}>Pedido con productos asociados</div>
                    )}
                    
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Total a pagar</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#059669' }}>S/ {(p.total || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Pie de tarjeta */}
                  <div style={{ padding: '14px 24px', background: '#fdfdfd', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setPedidoSeleccionado(p)}
                      style={{ padding: '9px 22px', background: '#059669', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.2)' }}
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

      {/* Modal de Detalle */}
      {pedidoSeleccionado && (() => {
        // Cálculo dinámico para la barra de seguimiento en vivo según el estado real
        const estado = pedidoSeleccionado.estado;
        const pasoPagado = true; // Todo pedido registrado ya está pagado
        const pasoValidado = estado === 'CONFIRMADO' || estado === 'EN_CAMINO' || estado === 'ENTREGADO';
        const pasoEmpacado = estado === 'EN_CAMINO' || estado === 'ENTREGADO';
        const pasoEntregado = estado === 'ENTREGADO';

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: 700, padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', maxHeight: '92vh', overflowY: 'auto' }}>
              
              {/* Cabecera del Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Detalle del Pedido #{pedidoSeleccionado.codigoPedido}</h2>
                    <span style={{ background: '#d1fae5', color: '#065f46', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                      ✓ {pedidoSeleccionado.estado}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Comprado el {new Date(pedidoSeleccionado.fechaPedido).toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => setPedidoSeleccionado(null)}
                  style={{ background: '#f3f4f6', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 14, cursor: 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>

              {/* Barra de Seguimiento en Vivo Dinámica */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 10 }}>Seguimiento de envío</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 600, flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ color: pasoPagado ? '#059669' : '#9ca3af' }}>{pasoPagado ? '✅' : '⏳'} Pagado</span> ─── 
                  <span style={{ color: pasoValidado ? '#059669' : '#9ca3af' }}>{pasoValidado ? '✅' : '⏳'} Validado</span> ─── 
                  <span style={{ color: pasoEmpacado ? '#059669' : '#9ca3af' }}>{pasoEmpacado ? '✅' : '⏳'} Empacado</span> ─── 
                  <span style={{ color: pasoEntregado ? '#059669' : '#9ca3af' }}>{pasoEntregado ? '✅' : '⏳'} Entregado</span>
                </div>
              </div>

              {/* Productos */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Productos en el pedido</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pedidoSeleccionado.detalles?.map((d, i) => (
                    <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, background: '#e6f4ea', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#059669', fontSize: 11 }}>
                          Rx
                        </div>
                        <div>
                          <strong style={{ display: 'block', color: '#111827', fontSize: 14, marginBottom: 2 }}>{d.nombreProducto}</strong>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>Cantidad: {d.cantidad} unidades • S/ {((d.subtotal || 0) / (d.cantidad || 1)).toFixed(2)} c/u</span>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: '#111827', fontSize: 15 }}>S/ {(d.subtotal || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receta Médica Asociada */}
              {pedidoSeleccionado.requiereReceta && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 2 }}>📄 Receta Médica Asociada</span>
                    <span style={{ fontSize: 12, color: '#15803d' }}>receta_digital_{pedidoSeleccionado.codigoPedido}.pdf (Auditado y Aprobado por Químico Farmacéutico)</span>
                  </div>
                  <button 
                    onClick={() => verReceta(pedidoSeleccionado)}
                    style={{ padding: '7px 16px', background: '#ffffff', border: '1px solid #86efac', color: '#15803d', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                  >
                    Ver Receta
                  </button>
                </div>
              )}

              {/* Dirección y Pago */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, background: '#ffffff' }}>
                  <h5 style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dirección de Entrega</h5>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{pedidoSeleccionado.envioDireccion || pedidoSeleccionado.recojoSede || 'Recojo en Tienda Principal'}</p>
                  <p style={{ fontSize: 12, color: '#4b5563', margin: '2px 0 0' }}>{pedidoSeleccionado.envioDistrito || 'Santiago de Surco, Lima'}</p>
                  {pedidoSeleccionado.envioReferencia && <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>Ref: {pedidoSeleccionado.envioReferencia}</p>}
                </div>
                
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, background: '#ffffff' }}>
                  <h5 style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Método de Pago y Factura</h5>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>💳 Tarjeta de Débito/Crédito</p>
                  <p style={{ fontSize: 12, color: '#4b5563', margin: '2px 0 0' }}>Boleta Electrónica: B001-{pedidoSeleccionado.id}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>DNI Titular: 74839201</p>
                </div>
              </div>

              {/* Totales */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                  <span>Subtotal</span>
                  <span>S/ {(pedidoSeleccionado.subtotal || pedidoSeleccionado.total).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                  <span>Costo de Envío</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>Gratis</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#111827', marginTop: 4 }}>
                  <span>Total Pagado</span>
                  <span style={{ color: '#059669' }}>S/ {(pedidoSeleccionado.total || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Botones inferiores */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => descargarPdf(pedidoSeleccionado.id, pedidoSeleccionado.codigoPedido)}
                  style={{ padding: '10px 18px', background: '#f3f4f6', color: '#111827', border: '1px solid #d1d5db', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  📥 Descargar Comprobante PDF
                </button>
                <button
                  onClick={() => setPedidoSeleccionado(null)}
                  style={{ padding: '10px 22px', background: '#059669', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
                >
                  Cerrar Detalle
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
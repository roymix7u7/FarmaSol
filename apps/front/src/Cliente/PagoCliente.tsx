import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { carritoApi, type Carrito } from '../api/carrito';
import { api, mensajeDeError } from '../api/client';
import '../Css/Checkout.css';

export function PagoCliente() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [codigo, setCodigo] = useState<string | null>(null);

  // Método principal: YAPE o VISA
  const [metodoPago, setMetodoPago] = useState<'YAPE' | 'VISA'>('YAPE');

  // Sub-opción para Yape: 'QR' o 'CODIGO'
  const [opcionYape, setOpcionYape] = useState<'QR' | 'CODIGO'>('QR');

  // Estados para Yape con código
  const [yapeCelular, setYapeCelular] = useState('');
  const [yapeCodigoOperacion, setYapeCodigoOperacion] = useState('');

  // Estados para Visa
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [expiracion, setExpiracion] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    carritoApi.ver().then(setCarrito).catch(() => setCarrito(null)).finally(() => setCargando(false));
  }, []);

  async function simularPago() {
    setError('');
    if (!carrito || carrito.items.length === 0) {
      setError('Tu carrito está vacío');
      return;
    }
    const recojo = JSON.parse(localStorage.getItem('datosRecojo') || 'null');
    if (!recojo) {
      setError('Faltan los datos de recojo. Vuelve a la página de Entrega.');
      return;
    }

    // Validaciones condicionales según el método seleccionado
    if (metodoPago === 'YAPE') {
      if (opcionYape === 'CODIGO') {
        if (!yapeCelular.trim() || !yapeCodigoOperacion.trim()) {
          setError('Por favor, ingresa tu número de celular y el código de aprobación de Yape.');
          return;
        }
        if (yapeCelular.trim().length < 9) {
          setError('El número de celular debe tener al menos 9 dígitos.');
          return;
        }
      }
    } else if (metodoPago === 'VISA') {
      if (!numeroTarjeta.trim() || !expiracion.trim() || !cvv.trim()) {
        setError('Por favor, completa todos los datos de tu tarjeta Visa para continuar.');
        return;
      }
      if (numeroTarjeta.replace(/\s/g, '').length < 16) {
        setError('El número de tarjeta debe tener al menos 16 dígitos.');
        return;
      }
    }

    setProcesando(true);
    try {
      await new Promise((r) => setTimeout(r, 900));

      const response = await api.post('/pedidos/checkout', {
        tipoEntrega: 'RECOJO_TIENDA',
        idSede: recojo.idSede,
        recojoNombre: recojo.recojoNombre,
        recojoDni: recojo.recojoDni,
        metodoPago: metodoPago,
        subMetodoYape: metodoPago === 'YAPE' ? opcionYape : null,
        yapeCelular: metodoPago === 'YAPE' && opcionYape === 'CODIGO' ? yapeCelular : null,
        yapeCodigoOperacion: metodoPago === 'YAPE' && opcionYape === 'CODIGO' ? yapeCodigoOperacion : null,
        notas: null,
      });

      const pedidos = response.data;
      const codigos = Array.isArray(pedidos)
        ? pedidos.map((p: any) => p.codigoPedido).join(', ')
        : 'PEDIDO-OK';

      localStorage.removeItem('datosRecojo');
      setCodigo(codigos);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo confirmar el pedido'));
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>Cargando…</div>;
  }

  if (codigo) {
    return (
      <div style={{ padding: 60, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>🎉</div>
        <h1 style={{ fontSize: 26, marginBottom: 10 }}>¡Pago confirmado con {metodoPago}!</h1>
        <p style={{ color: '#6b7280', marginBottom: 6 }}>Tu pedido fue registrado:</p>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#059669', marginBottom: 24 }}>
          {codigo}
        </p>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          Acércate a la sede elegida con tu DNI para recogerlo.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            background: '#059669',
            color: '#fff',
            borderRadius: 10,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  if (!carrito || carrito.items.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 12 }}>Tu carrito está vacío</h2>
        <Link to="/" style={{ color: '#059669', fontWeight: 600 }}>← Volver a la tienda</Link>
      </div>
    );
  }

  return (
    <div className="checkout-body">
      <div className="checkout-container">
        <header className="checkout-header-card">
          <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src="/img/farmsol.png" alt="FarmaSOL Logo" className="logo-img" />
          </div>

          <div className="checkout-steps">
            <div className="step completed">
              <span className="step-num"><i className="fa-solid fa-check"></i></span>
              <span className="step-text completed">Carrito</span>
            </div>
            <span className="step-divider">----------</span>
            <div className="step completed">
              <span className="step-num"><i className="fa-solid fa-check"></i></span>
              <span className="step-text completed">Entrega</span>
            </div>
            <span className="step-divider">----------</span>
            <div className="step active">
              <span className="step-num">3</span>
              <span className="step-text">Pago</span>
            </div>
          </div>

          <div className="user-profile">
            <i className="fa-solid fa-user"></i> {user?.nombres}
          </div>
        </header>

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

        <div className="cart-main-grid">
          <section className="cart-products-section">
            <h2 className="section-title">Selecciona tu método de pago</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <div
                onClick={() => { setMetodoPago('YAPE'); setError(''); }}
                style={{
                  padding: '16px',
                  border: `2px solid ${metodoPago === 'YAPE' ? '#059669' : '#e5e7eb'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: metodoPago === 'YAPE' ? '#f0fdf4' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '24px' }}>📱</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#1f2937' }}>Yape</h4>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#6b7280' }}>Código QR o Aprobación</p>
                </div>
              </div>

              <div
                onClick={() => { setMetodoPago('VISA'); setError(''); }}
                style={{
                  padding: '16px',
                  border: `2px solid ${metodoPago === 'VISA' ? '#059669' : '#e5e7eb'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: metodoPago === 'VISA' ? '#f0fdf4' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '24px' }}>💳</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#1f2937' }}>Visa / Mastercard</h4>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#6b7280' }}>Tarjeta de débito o crédito</p>
                </div>
              </div>
            </div>

            {metodoPago === 'YAPE' ? (
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '10px', marginBottom: '25px' }}>
                <p style={{ fontWeight: 600, color: '#374151', marginBottom: '12px', fontSize: '14px' }}>¿Cómo deseas pagar con Yape?</p>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => { setOpcionYape('QR'); setError(''); }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${opcionYape === 'QR' ? '#059669' : '#d1d5db'}`,
                      background: opcionYape === 'QR' ? '#059669' : '#fff',
                      color: opcionYape === 'QR' ? '#fff' : '#374151',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-qrcode" style={{ marginRight: '6px' }}></i> Escanear Código QR
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOpcionYape('CODIGO'); setError(''); }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${opcionYape === 'CODIGO' ? '#059669' : '#d1d5db'}`,
                      background: opcionYape === 'CODIGO' ? '#059669' : '#fff',
                      color: opcionYape === 'CODIGO' ? '#fff' : '#374151',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-receipt" style={{ marginRight: '6px' }}></i> Número + Código Aprobación
                  </button>
                </div>

                {opcionYape === 'QR' ? (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '10px' }}>Escanea el siguiente código con la app de Yape:</p>
                    <div style={{ width: '140px', height: '140px', background: '#e5e7eb', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: '#4b5563', fontSize: '12px', fontWeight: 500 }}>
                      [ Código QR FarmaSOL ]
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>Una vez escaneado y realizado el pago, presiona <strong>Pagar con Yape</strong>.</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '12px' }}>
                      Realiza la transferencia al número <strong>999 888 777</strong> e ingresa tus datos de confirmación:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4b5563', marginBottom: '4px' }}>Tu Celular Yape *</label>
                        <input
                          type="text"
                          maxLength={9}
                          value={yapeCelular}
                          onChange={(e) => setYapeCelular(e.target.value)}
                          placeholder="987654321"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4b5563', marginBottom: '4px' }}>Código de Aprobación / Op. *</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={yapeCodigoOperacion}
                          onChange={(e) => setYapeCodigoOperacion(e.target.value)}
                          placeholder="Ej. 123456"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '10px', marginBottom: '25px' }}>
                <p style={{ fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Datos de tu tarjeta (Obligatorios)</p>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4b5563', marginBottom: '4px' }}>Número de tarjeta *</label>
                  <input
                    type="text"
                    maxLength={19}
                    value={numeroTarjeta}
                    onChange={(e) => setNumeroTarjeta(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4b5563', marginBottom: '4px' }}>Expiración *</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={expiracion}
                      onChange={(e) => setExpiracion(e.target.value)}
                      placeholder="MM/AA"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4b5563', marginBottom: '4px' }}>CVV *</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <h3 className="section-title" style={{ marginTop: '20px' }}>Detalle de productos</h3>
            <div className="cart-table">
              <div className="table-header">
                <span className="col-prod">PRODUCTO</span>
                <span className="col-price">P. UNI</span>
                <span className="col-qty">CANT.</span>
                <span className="col-sub">SUBTOTAL</span>
              </div>

              {carrito.items.map((prod) => (
                <div className="table-row" key={prod.idProducto}>
                  <div className="col-prod item-info">
                    <div>
                      <h4>{prod.nombre}</h4>
                    </div>
                  </div>
                  <div className="col-price">S/ {prod.precioFinal.toFixed(2)}</div>
                  <div className="col-qty">{prod.cantidad}</div>
                  <div className="col-sub">S/ {prod.subtotal.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </section>

          <aside className="cart-summary-section">
            <h3>Resumen</h3>

            <div className="summary-details">
              <div className="summary-line">
                <span>Subtotal</span>
                <span className="sum-value">S/ {carrito.subtotal.toFixed(2)}</span>
              </div>
              {carrito.descuentoTotal > 0 && (
                <div className="summary-line">
                  <span>Descuentos</span>
                  <span className="sum-free">− S/ {carrito.descuentoTotal.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="summary-total-box">
              <div className="total-line">
                <span>Total a Pagar</span>
                <span className="total-price">S/ {carrito.total.toFixed(2)}</span>
              </div>
              <p className="tax-info">Incluye IGV.</p>
            </div>

            <button
              type="button"
              className="btn-continue"
              disabled={procesando}
              onClick={simularPago}
              style={{ opacity: procesando ? 0.7 : 1 }}
            >
              {procesando ? (
                'Procesando pago…'
              ) : (
                <>
                  <i className="fa-solid fa-credit-card"></i> Pagar con {metodoPago}
                </>
              )}
            </button>

            <Link
              to="/cliente/entrega"
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: 13,
                color: '#059669',
                fontWeight: 600,
                marginTop: '12px'
              }}
            >
              ← Volver a Entrega
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
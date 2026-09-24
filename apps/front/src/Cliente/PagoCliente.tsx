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

    setProcesando(true);
    try {
      // Simulamos procesamiento del pago (900ms)
      await new Promise((r) => setTimeout(r, 900));

      const response = await api.post('/pedidos/checkout', {
        tipoEntrega: 'RECOJO_TIENDA',
        idSede: recojo.idSede,
        recojoNombre: recojo.recojoNombre,
        recojoDni: recojo.recojoDni,
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

  // Pantalla de éxito
  if (codigo) {
    return (
      <div style={{ padding: 60, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>🎉</div>
        <h1 style={{ fontSize: 26, marginBottom: 10 }}>¡Pago confirmado!</h1>
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
            <h2 className="section-title">Confirmar pago</h2>

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

            <div className="form-alert full-width" style={{ marginTop: 20 }}>
              <i className="fa-solid fa-circle-info"></i>
              <span>
                Al confirmar, se <strong>simulará el pago</strong> y se descontará el stock de los
                productos.
              </span>
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
                  <i className="fa-solid fa-credit-card"></i> Simular pago
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
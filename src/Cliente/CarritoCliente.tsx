import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { carritoApi, type Carrito } from '../api/carrito';
import { useAuth } from '../auth/AuthContext';
import { mensajeDeError } from '../api/client';
import '../Css/Checkout.css';

export function CarritoCliente() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    carritoApi
      .ver()
      .then(setCarrito)
      .catch(() => setCarrito(null))
      .finally(() => setCargando(false));
  }, []);

  async function cambiarCantidad(idProducto: number, delta: number, actual: number) {
    const nueva = actual + delta;
    setError('');
    try {
      if (nueva <= 0) {
        if (!window.confirm('¿Eliminar este producto del carrito?')) return;
        const c = await carritoApi.eliminar(idProducto);
        setCarrito(c);
      } else {
        const c = await carritoApi.actualizar(idProducto, nueva);
        setCarrito(c);
      }
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo actualizar el carrito'));
    }
  }

  async function eliminarProducto(idProducto: number) {
    setError('');
    try {
      const c = await carritoApi.eliminar(idProducto);
      setCarrito(c);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar el producto'));
    }
  }

  if (cargando) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>Cargando…</div>
    );
  }

  if (!carrito || carrito.items.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 12 }}>Tu carrito está vacío</h2>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          style={{ color: '#059669', fontWeight: 600 }}
        >
          ← Volver a la tienda
        </a>
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
            <div className="step active">
              <span className="step-num">1</span>
              <span className="step-text">Carrito</span>
            </div>
            <span className="step-divider">----------</span>
            <div className="step">
              <span className="step-num inactive">2</span>
              <span className="step-text inactive">Entrega</span>
            </div>
            <span className="step-divider">----------</span>
            <div className="step">
              <span className="step-num inactive">3</span>
              <span className="step-text inactive">Pago</span>
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
            <h2 className="section-title">
              Tu Carrito de Compras ({carrito.cantidadItems} productos)
            </h2>

            <div className="cart-table">
              <div className="table-header">
                <span className="col-prod">PRODUCTO</span>
                <span className="col-price">P. UNI</span>
                <span className="col-qty">CANTIDAD</span>
                <span className="col-sub">SUBTOTAL</span>
              </div>

              {carrito.items.map((prod) => (
                <div className="table-row" key={prod.idProducto}>
                  <div className="col-prod item-info">
                    {prod.imagenUrl ? (
                      <img src={prod.imagenUrl} alt={prod.nombre} />
                    ) : (
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          background: '#f3f4f6',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                        }}
                      >
                        💊
                      </div>
                    )}
                    <div>
                      <h4>{prod.nombre}</h4>
                      <button
                        className="btn-delete"
                        onClick={() => eliminarProducto(prod.idProducto)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="col-price">S/ {prod.precioFinal.toFixed(2)}</div>
                  <div className="col-qty">
                    <div className="qty-box">
                      <button onClick={() => cambiarCantidad(prod.idProducto, -1, prod.cantidad)}>
                        -
                      </button>
                      <span>{prod.cantidad}</span>
                      <button onClick={() => cambiarCantidad(prod.idProducto, 1, prod.cantidad)}>
                        +
                      </button>
                    </div>
                  </div>
                  <div className="col-sub">S/ {prod.subtotal.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="continue-shopping">
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                ← Continuar comprando
              </a>
            </div>
          </section>

          <aside className="cart-summary-section">
            <h3>Resumen de Compra</h3>

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
              <p className="tax-info">Incluye IGV y comprobante electrónico.</p>
            </div>

            <button
              type="button"
              className="btn-continue"
              onClick={() => navigate('/cliente/entrega')}
            >
              Continuar con la Entrega <i className="fa-solid fa-arrow-right"></i>
            </button>

            <div className="security-badge">
              <i className="fa-solid fa-shield-halved"></i>
              <div>
                <strong>Compra 100% Segura</strong>
                <p>Tus transacciones están protegidas y cifradas.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
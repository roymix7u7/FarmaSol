import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import type { Sede } from '../types';
import '../Css/Checkout.css';

export function EntregaCliente() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [idSede, setIdSede] = useState<number | ''>('');
  const [nombreRetira, setNombreRetira] = useState(user?.nombres || '');
  const [dni, setDni] = useState('');

  useEffect(() => {
    api.get<Sede[]>('/sedes').then((r) => setSedes(r.data)).catch(() => setSedes([]));
  }, []);

  function handleIrAPagar(e: React.FormEvent) {
    e.preventDefault();
    if (!idSede) return alert('Elige una sede');
    if (!nombreRetira.trim() || !dni.trim()) return alert('Completa los datos de recojo');

    localStorage.setItem(
      'datosRecojo',
      JSON.stringify({ idSede, recojoNombre: nombreRetira.trim(), recojoDni: dni.trim() })
    );
    navigate('/cliente/pago');
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
            <div className="step active">
              <span className="step-num">2</span>
              <span className="step-text">Entrega</span>
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

        <main className="delivery-main-section">
          <h2 className="main-heading">Retiro en botica</h2>

          <form className="form-grid" onSubmit={handleIrAPagar}>
            <div className="form-group full-width">
              <label>Elige la sede de FarmaSOL para recoger *</label>
              <div className="select-wrapper">
                <select
                  className="form-select"
                  value={idSede}
                  onChange={(e) => setIdSede(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">— Elige una sede —</option>
                  {sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} — {s.direccion} {s.horario ? `(${s.horario})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Nombre completo de quien retira *</label>
              <input
                type="text"
                value={nombreRetira}
                onChange={(e) => setNombreRetira(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>DNI / Documento *</label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="72849102"
                required
              />
            </div>

            <div className="form-alert full-width">
              <i className="fa-solid fa-circle-info"></i>
              <span>Recuerda llevar tu DNI físico al momento de retirarlo.</span>
            </div>

            <div className="form-footer full-width" style={{ gridColumn: '1 / -1' }}>
              <a
                href="#"
                className="back-link"
                onClick={(e) => { e.preventDefault(); navigate('/carrito'); }}
              >
                ← Volver al Carrito
              </a>

              <button type="submit" className="btn-pay">
                Ir a Pagar →
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
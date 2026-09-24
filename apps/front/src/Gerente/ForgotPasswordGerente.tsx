import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, mensajeDeError } from '../api/client';
import '../Css/LoginPortal.css';

export function ForgotPasswordGerente() {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);
    try {
      const response = await api.post('/auth/recuperar', { correo });
      setMensaje(response.data);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo enviar la solicitud'));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="trabajador-body">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      ></link>

      <div className="trabajador-card">
        <div className="trabajador-logo">
          <img src="/img/farmsol.png" alt="FarmaSOL" />
        </div>

        <h1 className="trabajador-title">Recuperar Contraseña</h1>
        <p className="trabajador-subtitle">Portal Gerente</p>

        <div className="trabajador-divider"></div>

        <form onSubmit={onSubmit}>
          <div className="trabajador-field">
            <label className="trabajador-label" htmlFor="correo">
              Correo Electrónico
            </label>
            <div className="trabajador-input-box">
              <input
                type="email"
                id="correo"
                placeholder="gerente@farmasol.pe"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
          </div>

          {mensaje && (
            <div
              style={{
                padding: '12px',
                background: '#ecfdf5',
                border: '1px solid #d1fae5',
                borderRadius: '8px',
                color: '#047857',
                fontSize: '13.5px',
                textAlign: 'center',
                marginBottom: '14px',
                fontWeight: 500,
              }}
            >
              <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i>
              {mensaje}
            </div>
          )}

          {error && <p className="trabajador-error">{error}</p>}

          <button type="submit" className="trabajador-btn" disabled={cargando}>
            {cargando ? 'Enviando…' : 'Enviar Instrucciones'}
          </button>
        </form>

        <Link to="/gerente/login" className="trabajador-forgot">
          ← Volver al inicio de sesión
        </Link>

        <div className="trabajador-footer">
          <i className="fa-solid fa-lock"></i>
          <span>Conexión segura SSL de 256 bits</span>
        </div>
      </div>
    </div>
  );
}
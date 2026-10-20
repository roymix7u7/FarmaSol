import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, mensajeDeError } from '../api/client';
import { validarPassword, requisitosPassword } from '../shared/validaciones';
import '../Css/LoginPortal.css';

export function ForgotPasswordGerente() {
  const [usuario, setUsuario] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [passwordTocado, setPasswordTocado] = useState(false);

  const errorPassword = validarPassword(nuevaPassword);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setExito(false);
    setPasswordTocado(true);

    if (!usuario.trim()) {
      setError('Por favor, ingresa tu usuario.');
      return;
    }

    if (errorPassword) {
      setError('La contraseña no cumple con los requisitos de seguridad.');
      return;
    }

    setCargando(true);
    try {
      // AQUI ESTA LA RUTA CORRECTA
      await api.post('/auth/cambiar-password-personal', { 
        usuario: usuario.trim(), 
        nuevaPassword: nuevaPassword
      });
      setExito(true);
    } catch (err) {
      setError(mensajeDeError(err, 'El usuario no existe o está inactivo.'));
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
        <p className="trabajador-subtitle">Portal Gerente / Empleado</p>

        <div className="trabajador-divider"></div>

        <form onSubmit={onSubmit} noValidate>
          {error && <p className="trabajador-error">{error}</p>}

          {exito ? (
            <div
              style={{
                padding: '16px',
                background: '#ecfdf5',
                border: '1px solid #d1fae5',
                borderRadius: '8px',
                color: '#047857',
                fontSize: '14px',
                textAlign: 'center',
                marginBottom: '14px',
                fontWeight: 500,
              }}
            >
              <i className="fa-solid fa-circle-check" style={{ marginRight: '6px', fontSize: '18px' }}></i>
              <p style={{ marginTop: '8px' }}>¡Contraseña actualizada!</p>
              <p style={{ fontSize: '12px' }}>Ya puedes iniciar sesión con tu nueva clave.</p>
            </div>
          ) : (
            <>
              <div className="trabajador-field">
                <label className="trabajador-label" htmlFor="usuario">Usuario ID / Credencial</label>
                <div className="trabajador-input-box">
                  <input
                    type="text"
                    id="usuario"
                    placeholder="Ej: gerente"
                    required
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                  />
                </div>
              </div>

              <div className="trabajador-field">
                <label className="trabajador-label" htmlFor="nuevaPassword">Nueva Contraseña</label>
                <div className="trabajador-input-box">
                  <input
                    type="password"
                    id="nuevaPassword"
                    placeholder="••••••••"
                    required
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    onBlur={() => setPasswordTocado(true)}
                    style={{ borderColor: passwordTocado && errorPassword ? '#dc2626' : undefined }}
                  />
                </div>
                {/* Requisitos de la contraseña */}
                <ul className="requisitos" style={{ marginTop: 8, padding: 0, listStyle: 'none' }}>
                  {requisitosPassword(nuevaPassword).map((r) => (
                    <li key={r.texto} style={{ fontSize: 11.5, color: r.ok ? '#047857' : '#6b7280', display: 'inline-block', marginRight: 10 }}>
                      {r.ok ? '✓' : '·'} {r.texto}
                    </li>
                  ))}
                </ul>
              </div>

              <button type="submit" className="trabajador-btn" disabled={cargando} style={{ marginTop: '10px' }}>
                {cargando ? 'Guardando…' : 'Cambiar Contraseña'}
              </button>
            </>
          )}
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
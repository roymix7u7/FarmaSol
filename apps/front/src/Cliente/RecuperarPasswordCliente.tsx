import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, mensajeDeError } from '../api/client';
import { validarPassword, requisitosPassword } from '../shared/validaciones';
import fondo from '../assets/logoffondo.jpg';
import '../Css/Auth.css';

export function RecuperarPasswordCliente() {
  // Además del correo se pide el documento del registro: con solo el correo,
  // cualquiera podía cambiarle la contraseña a otra persona.
  const [correo, setCorreo] = useState('');
  const [dni, setDni] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [passwordTocado, setPasswordTocado] = useState(false);

  const errorPassword = validarPassword(nuevaPassword);
  const passwordValido = !errorPassword;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setExito(false);
    setPasswordTocado(true);

    if (!correo.trim()) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    if (!dni.trim()) {
      setError('Ingresa el número de documento con el que te registraste.');
      return;
    }

    if (errorPassword) {
      setError('La contraseña no cumple con los requisitos de seguridad.');
      return;
    }

    setCargando(true);
    try {
      await api.post('/auth/cambiar-password', {
        correo: correo.trim(),
        dni: dni.trim(),
        nuevaPassword: nuevaPassword
      });
      
      setExito(true);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo cambiar la contraseña.'));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="auth-card">
        <h1 className="auth-brand">FarmaSOL</h1>
        <h2 className="auth-title">Recuperar Contraseña</h2>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--texto-suave)', marginBottom: 20 }}>
          Ingresa tu correo, tu número de documento y elige una nueva contraseña.
        </p>

        <form onSubmit={onSubmit} noValidate>
          {error && <div className="form-error">{error}</div>}

          {exito ? (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #d1fae5',
              color: '#047857',
              padding: '20px 16px',
              borderRadius: '8px',
              textAlign: 'center',
              marginBottom: '16px',
              fontWeight: 500
            }}>
              <p style={{ marginBottom: 8, fontSize: 18 }}>¡Contraseña actualizada!</p>
              <p style={{ fontSize: 14 }}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            </div>
          ) : (
            <>
              <div className="auth-field">
                <label htmlFor="correo">Correo electrónico:</label>
                <input
                  id="correo"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="dni">N.° de documento (DNI o carné de extranjería):</label>
                <input
                  id="dni"
                  type="text"
                  inputMode="numeric"
                  placeholder="El mismo con el que te registraste"
                  maxLength={12}
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>

              <div
                className={`auth-field${
                  passwordValido ? ' es-valido' : passwordTocado && nuevaPassword ? ' es-invalido' : ''
                }`}
              >
                <label htmlFor="nuevaPassword">Nueva Contraseña:</label>
                <div className="campo-caja">
                  <input
                    id="nuevaPassword"
                    type="password"
                    placeholder="••••••••"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    onBlur={() => setPasswordTocado(true)}
                  />
                  {passwordValido && nuevaPassword && (
                    <span className="campo-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </div>
                
                <ul className="requisitos">
                  {requisitosPassword(nuevaPassword).map((r) => (
                    <li key={r.texto} className={r.ok ? 'cumple' : ''}>
                      {r.ok ? '✓' : '·'} {r.texto}
                    </li>
                  ))}
                </ul>
              </div>

              <button type="submit" className="auth-submit" disabled={cargando} style={{ marginTop: '20px' }}>
                {cargando ? 'Guardando…' : 'Cambiar Contraseña'}
              </button>
            </>
          )}
        </form>

        <div className="auth-links">
          <p>
            <Link to="/login">← Volver al Iniciar Sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
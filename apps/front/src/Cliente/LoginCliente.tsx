import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';
import { mensajeDeError } from '../api/client';
import { validarCorreo } from '../shared/validaciones';
import fondo from '../assets/logoffondo.jpg';
import '../Css/Auth.css';

interface DesdeState {
  from?: { pathname: string };
}

export function LoginCliente() {
  const { loginCliente } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as DesdeState | null)?.from?.pathname ?? '/';

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [correoTocado, setCorreoTocado] = useState(false);

  const errorCorreo = validarCorreo(usuario.trim());
  const correoValido = !errorCorreo;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCorreoTocado(true);
    if (errorCorreo) return;
    if (!password) {
      setError('Escribe tu contraseña');
      return;
    }
    setCargando(true);
    try {
      await loginCliente(usuario.trim(), password);
      navigate(destino, { replace: true });
    } catch (err) {
      // Mensaje genérico a propósito: decir cuál de los dos falló le diría a
      // un tercero si ese correo tiene cuenta.
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Correo o contraseña incorrectos');
      } else {
        setError(mensajeDeError(err, 'No se pudo iniciar sesión'));
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="auth-card">
        <h1 className="auth-brand">FarmaSOL</h1>
        <h2 className="auth-title">Iniciar Sesión</h2>

        <form onSubmit={onSubmit} noValidate>
          {error && <div className="form-error">{error}</div>}

          <div
            className={`auth-field${correoValido ? ' es-valido' : correoTocado && usuario ? ' es-invalido' : ''}`}
          >
            <label htmlFor="usuario">Correo electrónico:</label>
            <div className="campo-caja">
              <input
                id="usuario"
                type="email"
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                onBlur={() => setCorreoTocado(true)}
              />
              {correoValido && (
                <span className="campo-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </div>
            {correoTocado && errorCorreo && (
              <div className="campo-error" role="alert">
                {errorCorreo}
              </div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="password">Contraseña:</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
          </p>
          <p style={{ marginTop: 6 }}>
            <Link to="/recuperar-password">
              ¿Te has olvidado la contraseña?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { mensajeDeError } from '../api/client';
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await loginCliente(usuario.trim(), password);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(mensajeDeError(err, 'Usuario o contraseña incorrectos'));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="auth-card">
        <h1 className="auth-brand">FarmaSOL</h1>
        <h2 className="auth-title">Iniciar Sesión</h2>

        <form onSubmit={onSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="auth-field">
            <label htmlFor="usuario">Correo electrónico:</label>
            <input
              id="usuario"
              type="email"
              autoComplete="username"
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
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
            <Link to="/admin/login">¿Eres personal de FarmaSol?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

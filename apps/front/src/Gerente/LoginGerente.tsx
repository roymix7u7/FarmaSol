import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { mensajeDeError } from '../api/client';
import '../Css/LoginPortal.css';

export function LoginGerente() {
  const { loginPersonal } = useAuth();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await loginPersonal(usuario.trim(), password);
      navigate('/gerente', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err, 'Usuario o contraseña incorrectos'));
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

        <h1 className="trabajador-title">Portal Gerente</h1>
        <p className="trabajador-subtitle">Acceso restringido a personal autorizado</p>

        <div className="trabajador-divider"></div>

        <form onSubmit={onSubmit}>
          <div className="trabajador-field">
            <label className="trabajador-label" htmlFor="user">
              Usuario ID / Credencial
            </label>
            <div className="trabajador-input-box">
              <input
                type="text"
                id="user"
                placeholder="gerente_farmasol"
                required
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>
          </div>

          <div className="trabajador-field">
            <label className="trabajador-label" htmlFor="password">
              Contraseña
            </label>
            <div className="trabajador-input-box">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="trabajador-eye"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                aria-label="Mostrar contraseña"
              >
                <i
                  className={mostrarPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}
                ></i>
              </button>
            </div>
          </div>

          {error && <p className="trabajador-error">{error}</p>}

          <button type="submit" className="trabajador-btn" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Acceder al Sistema'}
          </button>
        </form>

        <Link to="/gerente/forgot-password" className="trabajador-forgot">
          ¿Olvidaste tu contraseña?
        </Link>

        <div className="trabajador-footer">
          <i className="fa-solid fa-lock"></i>
          <span>Conexión segura SSL de 256 bits</span>
        </div>
      </div>
    </div>
  );
}
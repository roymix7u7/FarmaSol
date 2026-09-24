import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { mensajeDeError } from '../api/client';
import '../Css/Auth.css';

export function RegistroCliente() {
  const { registrarCliente } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    correo: '',
    password: '',
    confirmar: '',
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function set<K extends keyof typeof form>(campo: K, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setCargando(true);
    try {
      await registrarCliente({
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        dni: form.dni.trim(),
        correo: form.correo.trim(),
        password: form.password,
        telefono: form.telefono.trim() || undefined,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo crear la cuenta'));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-page auth-page--plain">
      <div className="auth-card auth-card--wide">
        <h2 className="auth-title">Crear cuenta en FarmaSOL</h2>

        <form onSubmit={onSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="auth-grid">
            <div className="auth-field">
              <label htmlFor="nombres">Nombres</label>
              <input id="nombres" required value={form.nombres} onChange={(e) => set('nombres', e.target.value)} />
            </div>
            <div className="auth-field">
              <label htmlFor="apellidos">Apellidos</label>
              <input id="apellidos" required value={form.apellidos} onChange={(e) => set('apellidos', e.target.value)} />
            </div>

            <div className="auth-field">
              <label htmlFor="dni">DNI / Cédula</label>
              <input id="dni" required value={form.dni} onChange={(e) => set('dni', e.target.value)} />
            </div>
            <div className="auth-field">
              <label htmlFor="telefono">Teléfono</label>
              <input id="telefono" type="tel" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
            </div>

            <div className="auth-field auth-field--full">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                required
                value={form.correo}
                onChange={(e) => set('correo', e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="confirmar">Confirmar contraseña</label>
              <input
                id="confirmar"
                type="password"
                required
                autoComplete="new-password"
                value={form.confirmar}
                onChange={(e) => set('confirmar', e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={cargando}>
            {cargando ? 'Creando cuenta…' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            ¿Ya tienes cuenta? <Link to="/login">Iniciar Sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

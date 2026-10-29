import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { mensajeDeError } from '../api/client';
import {
  infoDocumento,
  limpiarDocumento,
  limpiarTelefono,
  requisitosPassword,
  TIPOS_DOCUMENTO,
  validarCorreo,
  validarDocumento,
  validarPassword,
  validarTelefono,
  type TipoDocumento,
} from '../shared/validaciones';
import '../Css/Auth.css';

type Campo =
  | 'nombres'
  | 'apellidos'
  | 'dni'
  | 'telefono'
  | 'correo'
  | 'password'
  | 'confirmar';

export function RegistroCliente() {
  const { registrarCliente } = useAuth();
  const navigate = useNavigate();

  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('DNI');
  const [form, setForm] = useState<Record<Campo, string>>({
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    correo: '',
    password: '',
    confirmar: '',
  });
  // Un campo solo muestra su error después de que el usuario lo dejó: avisar
  // mientras todavía está escribiendo es molesto y no ayuda.
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const errores: Record<Campo, string | null> = {
    nombres: form.nombres.trim() ? null : 'El nombre es obligatorio',
    apellidos: form.apellidos.trim() ? null : 'El apellido es obligatorio',
    dni: validarDocumento(tipoDocumento, form.dni),
    telefono: validarTelefono(form.telefono),
    correo: validarCorreo(form.correo.trim()),
    password: validarPassword(form.password),
    confirmar: !form.confirmar
      ? 'Repite la contraseña'
      : form.confirmar !== form.password
        ? 'Las contraseñas no coinciden'
        : null,
  };

  function set(campo: Campo, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function tocar(campo: Campo) {
    setTocados((t) => ({ ...t, [campo]: true }));
  }

  function cambiarTipo(tipo: TipoDocumento) {
    setTipoDocumento(tipo);
    // El número escrito para un tipo rara vez vale para el otro: se reajusta.
    setForm((f) => ({ ...f, dni: limpiarDocumento(tipo, f.dni) }));
  }

  /** Clase del contenedor: verde si es válido, rojo si ya se tocó y está mal. */
  function estado(campo: Campo) {
    if (!form[campo]) return tocados[campo] ? ' es-invalido' : '';
    if (errores[campo]) return tocados[campo] ? ' es-invalido' : '';
    return ' es-valido';
  }

  function mensaje(campo: Campo) {
    return tocados[campo] && errores[campo] ? (
      <div className="campo-error" role="alert">
        {errores[campo]}
      </div>
    ) : null;
  }

  function check(campo: Campo) {
    return !errores[campo] ? (
      <span className="campo-check" aria-hidden="true">
        ✓
      </span>
    ) : null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    // Al enviar se marcan todos, para que aparezcan los errores que falten.
    setTocados({
      nombres: true,
      apellidos: true,
      dni: true,
      telefono: true,
      correo: true,
      password: true,
      confirmar: true,
    });
    if (Object.values(errores).some(Boolean)) {
      setError('Revisa los campos marcados en rojo.');
      return;
    }

    setCargando(true);
    try {
      await registrarCliente({
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        tipoDocumento,
        dni: form.dni,
        correo: form.correo.trim(),
        password: form.password,
        telefono: form.telefono,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo crear la cuenta'));
    } finally {
      setCargando(false);
    }
  }

  const doc = infoDocumento(tipoDocumento);

  return (
    <div className="auth-page auth-page--plain">
      <div className="auth-card auth-card--wide">
        <h2 className="auth-title">Crear cuenta en FarmaSOL</h2>

        <form onSubmit={onSubmit} noValidate>
          {error && <div className="form-error">{error}</div>}

          <div className="auth-grid">
            <div className={`auth-field${estado('nombres')}`}>
              <label htmlFor="nombres">Nombres</label>
              <div className="campo-caja">
                <input
                  id="nombres"
                  autoComplete="given-name"
                  value={form.nombres}
                  onChange={(e) => set('nombres', e.target.value)}
                  onBlur={() => tocar('nombres')}
                />
                {check('nombres')}
              </div>
              {mensaje('nombres')}
            </div>

            <div className={`auth-field${estado('apellidos')}`}>
              <label htmlFor="apellidos">Apellidos</label>
              <div className="campo-caja">
                <input
                  id="apellidos"
                  autoComplete="family-name"
                  value={form.apellidos}
                  onChange={(e) => set('apellidos', e.target.value)}
                  onBlur={() => tocar('apellidos')}
                />
                {check('apellidos')}
              </div>
              {mensaje('apellidos')}
            </div>

            <div className="auth-field">
              <label htmlFor="tipoDocumento">Tipo de documento</label>
              <select
                id="tipoDocumento"
                value={tipoDocumento}
                onChange={(e) => cambiarTipo(e.target.value as TipoDocumento)}
              >
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div className={`auth-field${estado('dni')}`}>
              <label htmlFor="dni">Número de {doc.etiqueta}</label>
              <div className="campo-caja">
                <input
                  id="dni"
                  inputMode={doc.soloNumeros ? 'numeric' : 'text'}
                  maxLength={doc.largoMax}
                  placeholder={doc.soloNumeros ? '12345678' : '001234567'}
                  value={form.dni}
                  onChange={(e) => set('dni', limpiarDocumento(tipoDocumento, e.target.value))}
                  onBlur={() => tocar('dni')}
                />
                {check('dni')}
              </div>
              {mensaje('dni') ?? <div className="campo-ayuda">{doc.ayuda}</div>}
            </div>

            <div className={`auth-field auth-field--full${estado('telefono')}`}>
              <label htmlFor="telefono">Celular</label>
              <div className="campo-prefijo">
                <span>+51</span>
                <div className="campo-caja">
                  <input
                    id="telefono"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={9}
                    placeholder="987654321"
                    value={form.telefono}
                    onChange={(e) => set('telefono', limpiarTelefono(e.target.value))}
                    onBlur={() => tocar('telefono')}
                  />
                  {check('telefono')}
                </div>
              </div>
              {mensaje('telefono') ?? <div className="campo-ayuda">9 dígitos, empieza con 9</div>}
            </div>

            <div className={`auth-field auth-field--full${estado('correo')}`}>
              <label htmlFor="correo">Correo electrónico</label>
              <div className="campo-caja">
                <input
                  id="correo"
                  type="email"
                  autoComplete="email"
                  value={form.correo}
                  onChange={(e) => set('correo', e.target.value)}
                  onBlur={() => tocar('correo')}
                />
                {check('correo')}
              </div>
              {mensaje('correo') ?? (
                <div className="campo-ayuda">Con este correo iniciarás sesión</div>
              )}
            </div>

            <div className={`auth-field${estado('password')}`}>
              <label htmlFor="password">Contraseña</label>
              <div className="campo-caja">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  onBlur={() => tocar('password')}
                />
                {check('password')}
              </div>
              <ul className="requisitos">
                {requisitosPassword(form.password).map((r) => (
                  <li key={r.texto} className={r.ok ? 'cumple' : ''}>
                    {r.ok ? '✓' : '·'} {r.texto}
                  </li>
                ))}
              </ul>
            </div>

            <div className={`auth-field${estado('confirmar')}`}>
              <label htmlFor="confirmar">Confirmar contraseña</label>
              <div className="campo-caja">
                <input
                  id="confirmar"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmar}
                  onChange={(e) => set('confirmar', e.target.value)}
                  onBlur={() => tocar('confirmar')}
                />
                {check('confirmar')}
              </div>
              {mensaje('confirmar')}
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

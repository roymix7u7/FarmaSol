import { useEffect, useState } from 'react';
import { mensajeDeError } from '../api/client';
import { personalApi, type Personal, type PersonalPayload, type RolPersonal } from '../api/personal';
import { validarPassword } from '../shared/validaciones';
import '../Css/Dashboard.css';

const VACIO: PersonalPayload = {
  nombres: '',
  apellidos: '',
  usuario: '',
  correo: '',
  password: '',
  rol: 'EMPLEADO',
};

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PersonalGerente() {
  const [lista, setLista] = useState<Personal[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Personal | null>(null);
  const [form, setForm] = useState<PersonalPayload>(VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    setCargando(true);
    setError('');
    personalApi
      .listar()
      .then(setLista)
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar el personal')))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  function abrirNuevo() {
    setEditando(null);
    setForm(VACIO);
    setErrorForm('');
    setAbierto(true);
  }

  function abrirEditar(p: Personal) {
    setEditando(p);
    // La contraseña se deja vacía: solo se envía si se quiere cambiar.
    setForm({
      nombres: p.nombres,
      apellidos: p.apellidos,
      usuario: p.usuario,
      correo: p.correo,
      password: '',
      rol: p.rol,
    });
    setErrorForm('');
    setAbierto(true);
  }

  /** Valida en el cliente lo que pide el pliego, para dar un mensaje claro. */
  function validar(): string | null {
    if (!form.nombres.trim() || !form.apellidos.trim()) return 'Nombres y apellidos son obligatorios.';
    if (!form.usuario.trim()) return 'El usuario es obligatorio.';
    if (!/^[\w.-]+@farmasol\.pe$/i.test(form.correo.trim())) {
      return 'El correo debe ser corporativo, terminado en @farmasol.pe';
    }
    // Al editar, la contraseña vacía significa "no cambiarla".
    if (!editando || form.password) {
      return validarPassword(form.password ?? '');
    }
    return null;
  }

  async function guardar() {
    const problema = validar();
    if (problema) {
      setErrorForm(problema);
      return;
    }
    setGuardando(true);
    setErrorForm('');
    try {
      const payload: PersonalPayload = { ...form };
      if (editando && !payload.password) delete payload.password;

      if (editando) {
        await personalApi.actualizar(editando.id, payload);
      } else {
        await personalApi.crear(payload);
      }
      setAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(mensajeDeError(err, 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  }

  async function alternarEstado(p: Personal) {
    setError('');
    try {
      await personalApi.cambiarEstado(p.id, !p.activo);
      cargar();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo cambiar el estado'));
    }
  }

  const termino = busqueda.trim().toLowerCase();
  const visibles = termino
    ? lista.filter(
        (p) =>
          `${p.nombres} ${p.apellidos}`.toLowerCase().includes(termino) ||
          p.usuario.toLowerCase().includes(termino) ||
          p.correo.toLowerCase().includes(termino),
      )
    : lista;

  return (
    <div>
      {error && <div className="panel-aviso">{error}</div>}

      <div className="table-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Buscar colaborador por nombre, usuario o correo…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button className="btn-primary" onClick={abrirNuevo}>
          + Nuevo Empleado
        </button>
      </div>

      <div className="table-card">
        {cargando ? (
          <p className="panel-cargando">Cargando personal…</p>
        ) : visibles.length === 0 ? (
          <p className="panel-vacio">
            {lista.length === 0
              ? 'No hay colaboradores registrados.'
              : 'Ningún colaborador coincide con la búsqueda.'}
          </p>
        ) : (
          <>
            <div className="tabla-scroll">
            <table className="data-table ajustada">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Desde</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>
                        {p.nombres} {p.apellidos}
                      </strong>
                    </td>
                    <td>{p.usuario}</td>
                    <td>{p.correo}</td>
                    <td>
                      <span className={`badge ${p.rol === 'GERENTE' ? 'badge-blue' : 'badge-yellow'}`}>
                        {p.rol === 'GERENTE' ? 'Administrador' : 'Empleado'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.activo ? 'badge-green' : 'badge-red'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>{fecha(p.fechaCreacion)}</td>
                    <td>
                      <div className="acciones-fila">
                        <button className="btn-chico" onClick={() => abrirEditar(p)}>
                          Editar
                        </button>
                        <button
                          className={`btn-chico ${p.activo ? 'es-rojo' : ''}`}
                          onClick={() => alternarEstado(p)}
                        >
                          {p.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="table-footer">
              Mostrando {visibles.length} de {lista.length}{' '}
              {lista.length === 1 ? 'colaborador' : 'colaboradores'}
            </div>
          </>
        )}
      </div>

      {abierto && (
        <div className="modal-overlay" onClick={() => !guardando && setAbierto(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {editando ? 'Editar Colaborador' : 'Registrar Nuevo Colaborador'}
                </h2>
                <p className="modal-subtitle">
                  {editando
                    ? 'Deja la contraseña vacía para no cambiarla.'
                    : 'Tendrá acceso al portal según el rol que le asignes.'}
                </p>
              </div>
              <button className="modal-close" onClick={() => setAbierto(false)}>
                ×
              </button>
            </div>

            {errorForm && <div className="modal-error">{errorForm}</div>}

            <div className="modal-form">
              <div className="form-field">
                <label htmlFor="pn">Nombres *</label>
                <input
                  id="pn"
                  value={form.nombres}
                  onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                  placeholder="Juan Carlos"
                />
              </div>
              <div className="form-field">
                <label htmlFor="pa">Apellidos *</label>
                <input
                  id="pa"
                  value={form.apellidos}
                  onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                  placeholder="Pérez Ramos"
                />
              </div>
              <div className="form-field">
                <label htmlFor="pu">Usuario *</label>
                <input
                  id="pu"
                  value={form.usuario}
                  onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                  placeholder="j.perez"
                />
              </div>
              <div className="form-field">
                <label htmlFor="pc">Correo corporativo *</label>
                <input
                  id="pc"
                  type="email"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  placeholder="j.perez@farmasol.pe"
                />
              </div>
              <div className="form-field">
                <label htmlFor="pp">
                  {editando ? 'Contraseña nueva (opcional)' : 'Contraseña *'}
                </label>
                <input
                  id="pp"
                  type="password"
                  value={form.password ?? ''}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 8, una mayúscula y un número"
                />
              </div>
              <div className="form-field">
                <label htmlFor="pr">Rol de sistema *</label>
                <select
                  id="pr"
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value as RolPersonal })}
                >
                  <option value="EMPLEADO">Empleado</option>
                  <option value="GERENTE">Administrador</option>
                </select>
              </div>
            </div>

            {form.rol === 'EMPLEADO' && (
              <p
                style={{
                  fontSize: 12.5,
                  color: '#92400e',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginTop: 14,
                }}
              >
                Restricción de permisos: el rol Empleado no puede modificar el catálogo, los
                precios, las promociones ni el personal. Sí puede consultar el inventario,
                gestionar pedidos y revisar recetas.
              </p>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setAbierto(false)} disabled={guardando}>
                Cancelar
              </button>
              <button className="btn-save" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Asignar y Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

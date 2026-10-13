import { useEffect, useState } from 'react';
import { mensajeDeError } from '../api/client';
import { catalogoApi } from '../api/catalogo';
import {
  promocionesApi,
  type Promocion,
  type PromocionPayload,
  type TipoDescuento,
} from '../api/promociones';
import { enUnMesISO, hoyISO } from '../shared/fechas';
import type { Categoria } from '../types';
import '../Css/Dashboard.css';

const VACIO = (): PromocionPayload => ({
  titulo: '',
  descripcion: '',
  tipoDescuento: 'PORCENTAJE',
  valorDescuento: 10,
  fechaInicio: hoyISO(),
  fechaFin: enUnMesISO(),
  imagenBanner: '',
  mostrarEnCarrusel: false,
  orden: 1,
  idsProductos: [],
  idsCategorias: [],
});

function fechaCorta(iso: string) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

/** Aplana el árbol de categorías para poder elegirlas en una lista. */
function aplanar(cats: Categoria[], nivel = 0): { id: number; nombre: string; nivel: number }[] {
  return cats.flatMap((c) => [
    { id: c.id, nombre: c.nombre, nivel },
    ...aplanar(c.subcategorias ?? [], nivel + 1),
  ]);
}

export function PromocionesGerente() {
  const [lista, setLista] = useState<Promocion[]>([]);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string; nivel: number }[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Promocion | null>(null);
  const [form, setForm] = useState<PromocionPayload>(VACIO());
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<number | null>(null);

  function cargar() {
    setCargando(true);
    setError('');
    Promise.all([
      promocionesApi.listar(),
      catalogoApi.categoriasArbol().catch(() => [] as Categoria[]),
    ])
      .then(([p, c]) => {
        setLista(p);
        setCategorias(aplanar(c));
      })
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar las promociones')))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  function abrirNueva() {
    setEditando(null);
    setForm(VACIO());
    setErrorForm('');
    setAbierto(true);
  }

  function abrirEditar(p: Promocion) {
    setEditando(p);
    setForm({
      titulo: p.titulo,
      descripcion: p.descripcion ?? '',
      tipoDescuento: p.tipoDescuento,
      valorDescuento: p.valorDescuento,
      fechaInicio: p.fechaInicio,
      fechaFin: p.fechaFin,
      imagenBanner: p.imagenBanner ?? '',
      mostrarEnCarrusel: p.mostrarEnCarrusel,
      orden: p.orden,
      idsProductos: p.idsProductos ?? [],
      idsCategorias: p.idsCategorias ?? [],
    });
    setErrorForm('');
    setAbierto(true);
  }

  function validar(): string | null {
    if (form.titulo.trim().length < 5) return 'El título necesita al menos 5 caracteres.';
    if (form.valorDescuento <= 0) return 'El descuento debe ser mayor que cero.';
    if (form.tipoDescuento === 'PORCENTAJE' && form.valorDescuento > 100) {
      return 'Un descuento por porcentaje no puede pasar de 100.';
    }
    if (form.fechaFin < form.fechaInicio) {
      return 'La fecha de fin no puede ser anterior a la de inicio.';
    }
    if (form.idsCategorias.length === 0 && form.idsProductos.length === 0) {
      return 'Elige al menos una categoría para que la promoción aplique a algo.';
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
      const payload = {
        ...form,
        descripcion: form.descripcion?.trim() || null,
        imagenBanner: form.imagenBanner?.trim() || null,
      };
      if (editando) {
        await promocionesApi.actualizar(editando.id, payload);
      } else {
        await promocionesApi.crear(payload);
      }
      setAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(mensajeDeError(err, 'No se pudo guardar la promoción'));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(p: Promocion) {
    setError('');
    setBorrando(p.id);
    try {
      await promocionesApi.eliminar(p.id);
      cargar();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar la promoción'));
    } finally {
      setBorrando(null);
    }
  }

  function alternarCategoria(id: number) {
    setForm((f) => ({
      ...f,
      idsCategorias: f.idsCategorias.includes(id)
        ? f.idsCategorias.filter((x) => x !== id)
        : [...f.idsCategorias, id],
    }));
  }

  const vigentes = lista.filter((p) => p.vigente).length;

  return (
    <div>
      {error && <div className="panel-aviso">{error}</div>}

      <div className="kpi-row">
        <div className="kpi kpi-principal">
          <span className="kpi-label">Promociones vigentes</span>
          <span className="kpi-valor">{vigentes}</span>
          <span className="kpi-nota">Aplicándose ahora en la tienda</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Total registradas</span>
          <span className="kpi-valor">{lista.length}</span>
          <span className="kpi-nota">Incluye vencidas e inactivas</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">En el carrusel</span>
          <span className="kpi-valor">{lista.filter((p) => p.mostrarEnCarrusel).length}</span>
          <span className="kpi-nota">Visibles en la página principal</span>
        </div>
      </div>

      <div className="table-toolbar">
        <span style={{ fontSize: 13, color: 'var(--texto-suave)' }}>
          Las promociones vigentes se aplican solas al precio que ve el cliente.
        </span>
        <button className="btn-primary" onClick={abrirNueva}>
          + Nueva Promoción
        </button>
      </div>

      <div className="table-card">
        {cargando ? (
          <p className="panel-cargando">Cargando promociones…</p>
        ) : lista.length === 0 ? (
          <p className="panel-vacio">
            No hay promociones. Crea la primera con el botón de arriba.
          </p>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Promoción</th>
                  <th>Descuento</th>
                  <th>Vigencia</th>
                  <th>Aplica a</th>
                  <th>Carrusel</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.titulo}</strong>
                      {p.descripcion && (
                        <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>
                          {p.descripcion}
                        </div>
                      )}
                    </td>
                    <td>
                      {p.tipoDescuento === 'PORCENTAJE'
                        ? `${p.valorDescuento}%`
                        : `S/ ${p.valorDescuento.toFixed(2)}`}
                    </td>
                    <td style={{ fontSize: 12.5 }}>
                      {fechaCorta(p.fechaInicio)} — {fechaCorta(p.fechaFin)}
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--texto-suave)' }}>
                      {p.idsCategorias?.length ? `${p.idsCategorias.length} categoría(s)` : ''}
                      {p.idsCategorias?.length && p.idsProductos?.length ? ' · ' : ''}
                      {p.idsProductos?.length ? `${p.idsProductos.length} producto(s)` : ''}
                      {!p.idsCategorias?.length && !p.idsProductos?.length && '—'}
                    </td>
                    <td>{p.mostrarEnCarrusel ? `Sí (orden ${p.orden})` : 'No'}</td>
                    <td>
                      <span className={`badge ${p.vigente ? 'badge-green' : 'badge-red'}`}>
                        {p.vigente ? 'Vigente' : p.activo ? 'Fuera de fecha' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <div className="acciones-fila">
                        <button className="btn-chico" onClick={() => abrirEditar(p)}>
                          Editar
                        </button>
                        <button
                          className="btn-chico es-rojo"
                          disabled={borrando === p.id}
                          onClick={() => eliminar(p)}
                        >
                          {borrando === p.id ? 'Eliminando…' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">
              {lista.length} {lista.length === 1 ? 'promoción' : 'promociones'} · {vigentes} vigente
              {vigentes === 1 ? '' : 's'}
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
                  {editando ? 'Editar Promoción' : 'Nueva Promoción'}
                </h2>
                <p className="modal-subtitle">
                  Se aplicará automáticamente a los productos de las categorías que elijas.
                </p>
              </div>
              <button className="modal-close" onClick={() => setAbierto(false)}>
                ×
              </button>
            </div>

            {errorForm && <div className="modal-error">{errorForm}</div>}

            <div className="modal-form">
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="prt">Título *</label>
                <input
                  id="prt"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Campaña Invierno - 15% dto."
                />
              </div>
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="prd">Descripción</label>
                <input
                  id="prd"
                  value={form.descripcion ?? ''}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descuento en productos seleccionados de Farmacia"
                />
              </div>
              <div className="form-field">
                <label htmlFor="prtd">Tipo de descuento *</label>
                <select
                  id="prtd"
                  value={form.tipoDescuento}
                  onChange={(e) =>
                    setForm({ ...form, tipoDescuento: e.target.value as TipoDescuento })
                  }
                >
                  <option value="PORCENTAJE">Porcentaje (%)</option>
                  <option value="MONTO">Monto fijo (S/)</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="prv">
                  Valor * {form.tipoDescuento === 'PORCENTAJE' ? '(%)' : '(S/)'}
                </label>
                <input
                  id="prv"
                  type="number"
                  min={0}
                  step={form.tipoDescuento === 'PORCENTAJE' ? 1 : 0.1}
                  value={form.valorDescuento}
                  onChange={(e) => setForm({ ...form, valorDescuento: Number(e.target.value) })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="pri">Desde *</label>
                <input
                  id="pri"
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="prf">Hasta *</label>
                <input
                  id="prf"
                  type="date"
                  value={form.fechaFin}
                  onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="prb">Imagen del banner (ruta)</label>
                <input
                  id="prb"
                  value={form.imagenBanner ?? ''}
                  onChange={(e) => setForm({ ...form, imagenBanner: e.target.value })}
                  placeholder="/banners/invierno.jpg"
                />
              </div>
              <div className="form-field">
                <label htmlFor="pro">Orden en el carrusel</label>
                <input
                  id="pro"
                  type="number"
                  min={0}
                  value={form.orden}
                  onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="checkbox-field">
              <input
                id="prc"
                type="checkbox"
                checked={form.mostrarEnCarrusel}
                onChange={(e) => setForm({ ...form, mostrarEnCarrusel: e.target.checked })}
              />
              <label htmlFor="prc">Mostrar en el carrusel de la página principal</label>
            </div>

            <div style={{ marginTop: 16 }}>
              <label
                style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 8 }}
              >
                Categorías a las que aplica *
              </label>
              {categorias.length === 0 ? (
                <p style={{ fontSize: 12.5, color: 'var(--texto-suave)' }}>
                  No se pudieron cargar las categorías.
                </p>
              ) : (
                <div
                  style={{
                    maxHeight: 170,
                    overflowY: 'auto',
                    border: '1px solid var(--borde)',
                    borderRadius: 8,
                    padding: '8px 12px',
                  }}
                >
                  {categorias.map((c) => (
                    <label
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        padding: '4px 0',
                        paddingLeft: c.nivel * 16,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.idsCategorias.includes(c.id)}
                        onChange={() => alternarCategoria(c.id)}
                        style={{ accentColor: 'var(--verde)' }}
                      />
                      {c.nombre}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setAbierto(false)} disabled={guardando}>
                Cancelar
              </button>
              <button className="btn-save" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear promoción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

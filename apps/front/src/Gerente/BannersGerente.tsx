import { useEffect, useRef, useState } from 'react';
import { mensajeDeError } from '../api/client';
import { bannersApi, type Banner, type BannerPayload } from '../api/banners';
import { BannerSlide } from '../shared/CarruselBanners';
import '../Css/Dashboard.css';

const COLORES = ['#2ea471', '#1a56db', '#9333ea', '#e53935', '#f59e0b', '#0891b2', '#111827'];

/** Atajos para el botón del banner: las secciones que más se enlazan. */
const ENLACES_SUGERIDOS = [
  { valor: '/categoria/farmacia', texto: 'Farmacia' },
  { valor: '/categoria/mama-y-bebe', texto: 'Mamá y Bebé' },
  { valor: '/categoria/dermocosmetico', texto: 'Dermocosmético' },
  { valor: '/categoria/adulto-mayor', texto: 'Adulto Mayor' },
  { valor: '/nosotros', texto: 'Nosotros' },
];

const VACIO = (orden: number): BannerPayload => ({
  titulo: '',
  subtitulo: '',
  textoBoton: 'Ver más',
  enlace: '',
  imagenUrl: '',
  colorFondo: COLORES[0],
  fechaInicio: null,
  fechaFin: null,
  orden,
  activo: true,
});

function fechaCorta(iso: string) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function textoVigencia(b: Banner) {
  if (!b.fechaInicio && !b.fechaFin) return 'Siempre';
  if (b.fechaInicio && b.fechaFin) return `${fechaCorta(b.fechaInicio)} — ${fechaCorta(b.fechaFin)}`;
  if (b.fechaInicio) return `Desde ${fechaCorta(b.fechaInicio)}`;
  return `Hasta ${fechaCorta(b.fechaFin!)}`;
}

function estado(b: Banner): { texto: string; clase: string } {
  if (!b.activo) return { texto: 'Apagado', clase: 'badge-red' };
  if (b.vigente) return { texto: 'En la tienda', clase: 'badge-green' };
  return { texto: 'Fuera de fecha', clase: 'badge-yellow' };
}

export function BannersGerente() {
  const [lista, setLista] = useState<Banner[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerPayload>(VACIO(1));
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState<number | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  function cargar() {
    setCargando(true);
    setError('');
    bannersApi
      .listar()
      .then(setLista)
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar los banners')))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  function cambiar<K extends keyof BannerPayload>(campo: K, valor: BannerPayload[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function abrirNuevo() {
    const siguiente = lista.reduce((max, b) => Math.max(max, b.orden), 0) + 1;
    setEditando(null);
    setForm(VACIO(siguiente));
    setErrorForm('');
    setAbierto(true);
  }

  function abrirEditar(b: Banner) {
    setEditando(b);
    setForm({
      titulo: b.titulo,
      subtitulo: b.subtitulo ?? '',
      textoBoton: b.textoBoton ?? '',
      enlace: b.enlace ?? '',
      imagenUrl: b.imagenUrl ?? '',
      colorFondo: b.colorFondo,
      fechaInicio: b.fechaInicio,
      fechaFin: b.fechaFin,
      orden: b.orden,
      activo: b.activo,
    });
    setErrorForm('');
    setAbierto(true);
  }

  function validar(): string | null {
    if (form.titulo.trim().length < 3) return 'El título necesita al menos 3 caracteres.';
    const enlace = form.enlace?.trim() ?? '';
    if (enlace && !enlace.startsWith('/') && !/^https?:\/\//.test(enlace)) {
      return 'El enlace debe empezar con / (una página de la tienda) o con http(s)://';
    }
    if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio) {
      return 'La fecha de fin no puede ser anterior a la de inicio.';
    }
    if (form.orden < 0) return 'El orden no puede ser negativo.';
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
    const payload: BannerPayload = {
      ...form,
      titulo: form.titulo.trim(),
      subtitulo: form.subtitulo?.trim() || null,
      textoBoton: form.textoBoton?.trim() || null,
      enlace: form.enlace?.trim() || null,
      imagenUrl: form.imagenUrl?.trim() || null,
      fechaInicio: form.fechaInicio || null,
      fechaFin: form.fechaFin || null,
    };
    try {
      if (editando) await bannersApi.actualizar(editando.id, payload);
      else await bannersApi.crear(payload);
      setAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(mensajeDeError(err, 'No se pudo guardar el banner'));
    } finally {
      setGuardando(false);
    }
  }

  async function subirImagen(archivo: File) {
    const ext = archivo.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['jpg', 'jpeg', 'png', 'webp', 'jfif'].includes(ext)) {
      setErrorForm('Solo se permiten imágenes JPG, PNG, WEBP o JFIF.');
      return;
    }
    setSubiendo(true);
    setErrorForm('');
    try {
      cambiar('imagenUrl', await bannersApi.subirImagen(archivo));
    } catch (err) {
      setErrorForm(mensajeDeError(err, 'No se pudo subir la imagen'));
    } finally {
      setSubiendo(false);
      if (inputArchivo.current) inputArchivo.current.value = '';
    }
  }

  async function alternarActivo(b: Banner) {
    setError('');
    setOcupado(b.id);
    try {
      const actualizado = await bannersApi.cambiarActivo(b.id, !b.activo);
      setLista((l) => l.map((x) => (x.id === b.id ? actualizado : x)));
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo cambiar el estado del banner'));
    } finally {
      setOcupado(null);
    }
  }

  async function eliminar(b: Banner) {
    setError('');
    setOcupado(b.id);
    try {
      await bannersApi.eliminar(b.id);
      setConfirmarBorrar(null);
      setLista((l) => l.filter((x) => x.id !== b.id));
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar el banner'));
    } finally {
      setOcupado(null);
    }
  }

  const enTienda = lista.filter((b) => b.vigente).length;

  return (
    <div>
      {error && <div className="panel-aviso">{error}</div>}

      <div className="kpi-row">
        <div className="kpi kpi-principal">
          <span className="kpi-label">En la tienda ahora</span>
          <span className="kpi-valor">{enTienda}</span>
          <span className="kpi-nota">Se ven en el carrusel del inicio</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Total de banners</span>
          <span className="kpi-valor">{lista.length}</span>
          <span className="kpi-nota">Incluye apagados y fuera de fecha</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Cambio cada</span>
          <span className="kpi-valor">6 s</span>
          <span className="kpi-nota">El carrusel avanza solo</span>
        </div>
      </div>

      <div className="table-toolbar">
        <span style={{ fontSize: 13, color: 'var(--texto-suave)' }}>
          Los banners salen en el carrusel de la página principal, del orden más bajo al más alto.
        </span>
        <button className="btn-primary" onClick={abrirNuevo}>
          + Nuevo Banner
        </button>
      </div>

      <div className="table-card">
        {cargando ? (
          <p className="panel-cargando">Cargando banners…</p>
        ) : lista.length === 0 ? (
          <p className="panel-vacio">
            No hay banners. Crea el primero y aparecerá en la página principal.
          </p>
        ) : (
          <>
            <div className="tabla-scroll">
              <table className="data-table ajustada">
                <thead>
                  <tr>
                    <th>Vista previa</th>
                    <th>Banner</th>
                    <th>Lleva a</th>
                    <th>Vigencia</th>
                    <th>Orden</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((b) => {
                    const est = estado(b);
                    return (
                      <tr key={b.id}>
                        <td>
                          <div
                            style={{
                              width: 120,
                              height: 48,
                              borderRadius: 8,
                              background: `linear-gradient(120deg, ${b.colorFondo}, color-mix(in srgb, ${b.colorFondo} 70%, #000))`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              padding: 4,
                            }}
                          >
                            {b.imagenUrl && (
                              <img
                                src={b.imagenUrl}
                                alt=""
                                style={{ maxHeight: 40, maxWidth: 50, objectFit: 'contain' }}
                              />
                            )}
                          </div>
                        </td>
                        <td className="envolver">
                          <strong>{b.titulo}</strong>
                          {b.subtitulo && (
                            <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>
                              {b.subtitulo}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: 12.5 }}>
                          {b.enlace ? (
                            <code>{b.enlace}</code>
                          ) : (
                            <span style={{ color: 'var(--texto-suave)' }}>Sin botón</span>
                          )}
                        </td>
                        <td style={{ fontSize: 12.5 }}>{textoVigencia(b)}</td>
                        <td>{b.orden}</td>
                        <td>
                          <span className={`badge ${est.clase}`}>{est.texto}</span>
                        </td>
                        <td>
                          {confirmarBorrar === b.id ? (
                            <div className="acciones-fila">
                              <span style={{ fontSize: 12.5 }}>¿Eliminar?</span>
                              <button
                                className="btn-chico es-rojo"
                                disabled={ocupado === b.id}
                                onClick={() => eliminar(b)}
                              >
                                {ocupado === b.id ? 'Eliminando…' : 'Sí, eliminar'}
                              </button>
                              <button className="btn-chico" onClick={() => setConfirmarBorrar(null)}>
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="acciones-fila">
                              <button className="btn-chico" onClick={() => abrirEditar(b)}>
                                Editar
                              </button>
                              <button
                                className={`btn-chico ${b.activo ? '' : 'es-verde'}`}
                                disabled={ocupado === b.id}
                                onClick={() => alternarActivo(b)}
                              >
                                {b.activo ? 'Apagar' : 'Encender'}
                              </button>
                              <button
                                className="btn-chico es-rojo"
                                onClick={() => setConfirmarBorrar(b.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              {lista.length} {lista.length === 1 ? 'banner' : 'banners'} · {enTienda} en la tienda
            </div>
          </>
        )}
      </div>

      {abierto && (
        <div className="modal-overlay" onClick={() => !guardando && setAbierto(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: 720 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editando ? 'Editar Banner' : 'Nuevo Banner'}</h2>
                <p className="modal-subtitle">Así se verá en el carrusel de la página principal.</p>
              </div>
              <button className="modal-close" onClick={() => setAbierto(false)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <BannerSlide
                compacto
                banner={{
                  id: 'vista-previa',
                  titulo: form.titulo,
                  subtitulo: form.subtitulo,
                  textoBoton: form.textoBoton,
                  enlace: form.enlace,
                  imagenUrl: form.imagenUrl,
                  colorFondo: form.colorFondo,
                }}
              />
            </div>

            {errorForm && <div className="modal-error">{errorForm}</div>}

            <div className="modal-form">
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="bnt">Título * ({form.titulo.length}/80)</label>
                <input
                  id="bnt"
                  maxLength={80}
                  value={form.titulo}
                  onChange={(e) => cambiar('titulo', e.target.value)}
                  placeholder="Hasta 30% en protectores solares"
                />
              </div>
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="bns">Subtítulo ({(form.subtitulo ?? '').length}/200)</label>
                <input
                  id="bns"
                  maxLength={200}
                  value={form.subtitulo ?? ''}
                  onChange={(e) => cambiar('subtitulo', e.target.value)}
                  placeholder="Solo esta semana, en todas nuestras sedes y online"
                />
              </div>
              <div className="form-field">
                <label htmlFor="bnb">Texto del botón</label>
                <input
                  id="bnb"
                  maxLength={30}
                  value={form.textoBoton ?? ''}
                  onChange={(e) => cambiar('textoBoton', e.target.value)}
                  placeholder="Ver más"
                />
              </div>
              <div className="form-field">
                <label htmlFor="bne">El botón lleva a</label>
                <input
                  id="bne"
                  list="bn-enlaces"
                  value={form.enlace ?? ''}
                  onChange={(e) => cambiar('enlace', e.target.value)}
                  placeholder="/categoria/farmacia (vacío = sin botón)"
                />
                <datalist id="bn-enlaces">
                  {ENLACES_SUGERIDOS.map((e) => (
                    <option key={e.valor} value={e.valor}>
                      {e.texto}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="bni">Imagen (opcional, se muestra a la derecha)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="bni"
                    style={{ flex: 1 }}
                    value={form.imagenUrl ?? ''}
                    onChange={(e) => cambiar('imagenUrl', e.target.value)}
                    placeholder="/img/productos/mi-imagen.png"
                  />
                  <button
                    type="button"
                    className="btn-chico"
                    disabled={subiendo}
                    onClick={() => inputArchivo.current?.click()}
                  >
                    {subiendo ? 'Subiendo…' : 'Subir imagen'}
                  </button>
                  {form.imagenUrl && (
                    <button
                      type="button"
                      className="btn-chico es-rojo"
                      onClick={() => cambiar('imagenUrl', '')}
                    >
                      Quitar
                    </button>
                  )}
                  <input
                    ref={inputArchivo}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.jfif"
                    hidden
                    onChange={(e) => e.target.files?.[0] && subirImagen(e.target.files[0])}
                  />
                </div>
              </div>

              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label>Color de fondo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {COLORES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Color ${c}`}
                      onClick={() => cambiar('colorFondo', c)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: c,
                        border:
                          form.colorFondo.toLowerCase() === c
                            ? '3px solid var(--texto)'
                            : '2px solid #fff',
                        boxShadow: '0 0 0 1px var(--borde)',
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    aria-label="Elegir otro color"
                    value={form.colorFondo}
                    onChange={(e) => cambiar('colorFondo', e.target.value)}
                    style={{ width: 40, height: 32, padding: 0, border: 'none', background: 'none' }}
                  />
                  <code style={{ fontSize: 12 }}>{form.colorFondo}</code>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="bnfi">Mostrar desde (opcional)</label>
                <input
                  id="bnfi"
                  type="date"
                  value={form.fechaInicio ?? ''}
                  onChange={(e) => cambiar('fechaInicio', e.target.value || null)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="bnff">Mostrar hasta (opcional)</label>
                <input
                  id="bnff"
                  type="date"
                  value={form.fechaFin ?? ''}
                  onChange={(e) => cambiar('fechaFin', e.target.value || null)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="bno">Orden en el carrusel</label>
                <input
                  id="bno"
                  type="number"
                  min={0}
                  value={form.orden}
                  onChange={(e) => cambiar('orden', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="checkbox-field">
              <input
                id="bna"
                type="checkbox"
                checked={form.activo}
                onChange={(e) => cambiar('activo', e.target.checked)}
              />
              <label htmlFor="bna">Encendido (se muestra en la tienda si está dentro de sus fechas)</label>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setAbierto(false)} disabled={guardando}>
                Cancelar
              </button>
              <button className="btn-save" onClick={guardar} disabled={guardando || subiendo}>
                {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

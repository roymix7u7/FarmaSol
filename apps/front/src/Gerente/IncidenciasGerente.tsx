import { useEffect, useState } from 'react';
import { mensajeDeError } from '../api/client';
import {
  incidenciasApi,
  textoTipo,
  TIPOS_INCIDENCIA,
  type Incidencia,
} from '../api/incidencias';
import '../Css/Dashboard.css';

interface Props {
  /** El gerente ve los de todo el equipo y los resuelve; el empleado, solo los suyos. */
  esGerente: boolean;
  /** Abre el formulario para reportar (lo usa el empleado). */
  onReportar: () => void;
  /** Se llama tras resolver, para refrescar la campana. */
  onCambio: () => void;
  /** Cambia cuando el empleado envía un reporte nuevo, para recargar la lista. */
  version: number;
}

function fechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function hace(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}

export function IncidenciasGerente({ esGerente, onReportar, onCambio, version }: Props) {
  const [lista, setLista] = useState<Incidencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<'PENDIENTE' | 'RESUELTA' | 'TODAS'>('PENDIENTE');
  const [resolviendo, setResolviendo] = useState<Incidencia | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorResolver, setErrorResolver] = useState('');

  function cargar() {
    setCargando(true);
    setError('');
    (esGerente ? incidenciasApi.listar() : incidenciasApi.mias())
      .then(setLista)
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar los reportes')))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [esGerente, version]);

  async function confirmarResolver() {
    if (!resolviendo) return;
    setGuardando(true);
    setErrorResolver('');
    try {
      const actualizado = await incidenciasApi.resolver(resolviendo.id, respuesta.trim() || null);
      setLista((l) => l.map((x) => (x.id === actualizado.id ? actualizado : x)));
      setResolviendo(null);
      onCambio();
    } catch (err) {
      setErrorResolver(mensajeDeError(err, 'No se pudo marcar como resuelto'));
    } finally {
      setGuardando(false);
    }
  }

  const pendientes = lista.filter((i) => i.estado === 'PENDIENTE');
  const urgentes = pendientes.filter((i) => i.urgente).length;
  const visibles = filtro === 'TODAS' ? lista : lista.filter((i) => i.estado === filtro);

  return (
    <div>
      {error && <div className="panel-aviso">{error}</div>}

      <div className="kpi-row">
        <div className="kpi kpi-principal">
          <span className="kpi-label">{esGerente ? 'Por resolver' : 'Esperando respuesta'}</span>
          <span className="kpi-valor">{pendientes.length}</span>
          <span className="kpi-nota">
            {esGerente ? 'Reportes del equipo sin atender' : 'Tus reportes que el gerente aún no resuelve'}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Urgentes</span>
          <span className="kpi-valor" style={{ color: urgentes ? '#b91c1c' : undefined }}>
            {urgentes}
          </span>
          <span className="kpi-nota">Afectan la atención ahora mismo</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Resueltos</span>
          <span className="kpi-valor">{lista.length - pendientes.length}</span>
          <span className="kpi-nota">{esGerente ? 'Total histórico' : 'Con respuesta del gerente'}</span>
        </div>
      </div>

      <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="filtro-pastillas" role="tablist" aria-label="Filtrar por estado">
          {(
            [
              ['PENDIENTE', 'Pendientes'],
              ['RESUELTA', 'Resueltos'],
              ['TODAS', 'Todos'],
            ] as const
          ).map(([valor, texto]) => (
            <button
              key={valor}
              role="tab"
              aria-selected={filtro === valor}
              className={filtro === valor ? 'activo' : undefined}
              onClick={() => setFiltro(valor)}
            >
              {texto}
            </button>
          ))}
        </div>
        {!esGerente && (
          <button className="btn-primary" onClick={onReportar}>
            <i className="fa-solid fa-flag"></i> Reportar un problema
          </button>
        )}
      </div>

      {cargando ? (
        <p className="panel-cargando">Cargando reportes…</p>
      ) : visibles.length === 0 ? (
        <div className="table-card">
          <div className="reporte-vacio">
            <i className="fa-regular fa-circle-check"></i>
            <p>
              {filtro === 'PENDIENTE'
                ? esGerente
                  ? 'No hay reportes pendientes del equipo.'
                  : 'No tienes reportes esperando respuesta.'
                : 'No hay reportes en esta lista.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="reportes-lista">
          {visibles.map((i) => {
            const tipo = TIPOS_INCIDENCIA.find((t) => t.valor === i.tipo);
            return (
              <article
                key={i.id}
                className={`reporte-card${i.estado === 'RESUELTA' ? ' es-resuelto' : ''}${i.urgente && i.estado === 'PENDIENTE' ? ' es-urgente' : ''}`}
              >
                <div className="reporte-icono">
                  <i className={`fa-solid ${tipo?.icono ?? 'fa-flag'}`}></i>
                </div>
                <div className="reporte-cuerpo">
                  <div className="reporte-cabecera">
                    <strong>{textoTipo(i.tipo)}</strong>
                    {i.urgente && i.estado === 'PENDIENTE' && <span className="badge badge-red">Urgente</span>}
                    <span className={`badge ${i.estado === 'PENDIENTE' ? 'badge-yellow' : 'badge-green'}`}>
                      {i.estado === 'PENDIENTE' ? 'Pendiente' : 'Resuelto'}
                    </span>
                  </div>
                  <p className="reporte-descripcion">{i.descripcion}</p>
                  <div className="reporte-meta">
                    <span>#{String(i.id).padStart(4, '0')}</span>
                    {esGerente && (
                      <span>
                        <i className="fa-regular fa-user"></i> {i.reportadoPor}
                      </span>
                    )}
                    <span title={fechaHora(i.fechaReporte)}>
                      <i className="fa-regular fa-clock"></i> {hace(i.fechaReporte)}
                    </span>
                    {i.referencia && (
                      <span>
                        <i className="fa-solid fa-link"></i> {i.referencia}
                      </span>
                    )}
                  </div>
                  {i.estado === 'RESUELTA' && (
                    <div className="reporte-respuesta">
                      <strong>
                        Resuelto por {i.resueltoPor}
                        {i.fechaResolucion && ` · ${fechaHora(i.fechaResolucion)}`}
                      </strong>
                      {i.respuesta ? <p>{i.respuesta}</p> : <p className="sin-respuesta">Sin comentarios.</p>}
                    </div>
                  )}
                </div>
                {esGerente && i.estado === 'PENDIENTE' && (
                  <button
                    className="btn-chico es-verde reporte-accion"
                    onClick={() => {
                      setResolviendo(i);
                      setRespuesta('');
                      setErrorResolver('');
                    }}
                  >
                    <i className="fa-solid fa-check" style={{ marginRight: 6 }}></i>
                    Marcar resuelto
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {resolviendo && (
        <div className="modal-overlay" onClick={() => !guardando && setResolviendo(null)}>
          <div className="modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Resolver reporte #{String(resolviendo.id).padStart(4, '0')}</h2>
                <p className="modal-subtitle">
                  {textoTipo(resolviendo.tipo)} · de {resolviendo.reportadoPor}
                </p>
              </div>
              <button className="modal-close" onClick={() => setResolviendo(null)} aria-label="Cerrar">
                ×
              </button>
            </div>
            <p className="reporte-cita">“{resolviendo.descripcion}”</p>
            {errorResolver && <div className="modal-error">{errorResolver}</div>}
            <div className="form-field">
              <label htmlFor="rs-resp">Respuesta para {resolviendo.reportadoPor.split(' ')[0]} (opcional)</label>
              <textarea
                id="rs-resp"
                rows={3}
                maxLength={500}
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Ej. Ya corregí el stock en el sistema. Gracias por avisar."
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setResolviendo(null)} disabled={guardando}>
                Cancelar
              </button>
              <button className="btn-save" onClick={confirmarResolver} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Marcar como resuelto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

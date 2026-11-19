import { useState } from 'react';
import { mensajeDeError } from '../api/client';
import {
  incidenciasApi,
  TIPOS_INCIDENCIA,
  type Incidencia,
  type TipoIncidencia,
} from '../api/incidencias';
import '../Css/Dashboard.css';

interface Props {
  /** Con qué tipo abre (desde el inventario, "diferencia de stock"). */
  tipoInicial?: TipoIncidencia;
  onCerrar: () => void;
  /** Avisa que se envió, para refrescar las alertas y "Mis reportes". */
  onEnviado?: (incidencia: Incidencia) => void;
}

/** El trabajador le reporta un problema al gerente. Queda guardado y le llega como notificación. */
export function ModalReportarProblema({ tipoInicial = 'STOCK', onCerrar, onEnviado }: Props) {
  const [tipo, setTipo] = useState<TipoIncidencia>(tipoInicial);
  const [urgente, setUrgente] = useState(false);
  const [referencia, setReferencia] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState<Incidencia | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (descripcion.trim().length < 10) {
      setError('Cuéntale al gerente qué pasó (al menos 10 caracteres).');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const creado = await incidenciasApi.reportar({
        tipo,
        urgente,
        referencia: referencia.trim() || null,
        descripcion: descripcion.trim(),
      });
      setEnviado(creado);
      onEnviado?.(creado);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo enviar el reporte'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={() => !enviando && onCerrar()}>
      <div className="modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        {enviado ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div className="reporte-ok-icono">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="modal-title" style={{ marginBottom: 6 }}>Reporte enviado al gerente</h2>
            <p className="modal-subtitle" style={{ marginBottom: 20 }}>
              Le aparece en sus notificaciones. Cuando lo resuelva, te avisaremos en la campana y
              lo verás en <strong>Mis reportes</strong>.
            </p>
            <div className="reporte-resumen">
              <div>
                <span>Tipo</span>
                <strong>{TIPOS_INCIDENCIA.find((t) => t.valor === enviado.tipo)?.texto}</strong>
              </div>
              {enviado.referencia && (
                <div>
                  <span>Referencia</span>
                  <strong>{enviado.referencia}</strong>
                </div>
              )}
              <div>
                <span>Prioridad</span>
                <strong>{enviado.urgente ? 'Urgente' : 'Normal'}</strong>
              </div>
              <div>
                <span>N° de reporte</span>
                <strong>#{String(enviado.id).padStart(4, '0')}</strong>
              </div>
            </div>
            <button className="btn-save" style={{ width: '100%', marginTop: 20 }} onClick={onCerrar}>
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={enviar}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Reportar un problema al gerente</h2>
                <p className="modal-subtitle">
                  Queda registrado y le llega como notificación en su panel.
                </p>
              </div>
              <button type="button" className="modal-close" onClick={onCerrar} aria-label="Cerrar">
                ×
              </button>
            </div>

            {error && <div className="modal-error">{error}</div>}

            <div className="form-field" style={{ marginBottom: 14 }}>
              <label>¿Qué pasó? *</label>
              <div className="tipos-incidencia">
                {TIPOS_INCIDENCIA.map((t) => (
                  <button
                    key={t.valor}
                    type="button"
                    className={`tipo-incidencia${tipo === t.valor ? ' activo' : ''}`}
                    onClick={() => setTipo(t.valor)}
                    aria-pressed={tipo === t.valor}
                  >
                    <i className={`fa-solid ${t.icono}`}></i>
                    {t.texto}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-field" style={{ marginBottom: 14 }}>
              <label htmlFor="rp-ref">Pedido o producto relacionado (opcional)</label>
              <input
                id="rp-ref"
                maxLength={120}
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej. PED-2026-000019 o Paracetamol 500mg"
              />
            </div>

            <div className="form-field" style={{ marginBottom: 14 }}>
              <label htmlFor="rp-desc">Descripción * ({descripcion.length}/500)</label>
              <textarea
                id="rp-desc"
                rows={4}
                maxLength={500}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. En el anaquel hay 3 unidades, pero el sistema dice 8."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="checkbox-field">
              <input
                id="rp-urg"
                type="checkbox"
                checked={urgente}
                onChange={(e) => setUrgente(e.target.checked)}
              />
              <label htmlFor="rp-urg">Es urgente (afecta la atención ahora mismo)</label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onCerrar} disabled={enviando}>
                Cancelar
              </button>
              <button type="submit" className="btn-save" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar al gerente'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

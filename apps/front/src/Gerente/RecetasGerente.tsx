import { useEffect, useState } from 'react';
import { mensajeDeError } from '../api/client';
import { recetasAdminApi, type Receta } from '../api/recetas';
import '../Css/Dashboard.css';

function fechaHora(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RecetasGerente() {
  const [lista, setLista] = useState<Receta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState<number | null>(null);

  // Rechazar exige un motivo: el cliente tiene que saber qué corregir.
  const [rechazando, setRechazando] = useState<Receta | null>(null);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');

  // Estado para la ventana de ayuda
  const [ayudaAbierta, setAyudaAbierta] = useState(false);

  function cargar() {
    setCargando(true);
    setError('');
    recetasAdminApi
      .pendientes()
      .then(setLista)
      .catch((err) => setError(mensajeDeError(err, 'No se pudieron cargar las recetas')))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function ver(r: Receta) {
    setError('');
    try {
      await recetasAdminApi.abrirArchivo(r.id);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo abrir el archivo de la receta'));
    }
  }

  async function aprobar(r: Receta) {
    setProcesando(r.id);
    setError('');
    try {
      await recetasAdminApi.aprobar(r.id);
      cargar();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo aprobar la receta'));
    } finally {
      setProcesando(null);
    }
  }

  async function confirmarRechazo() {
    if (!rechazando) return;
    if (motivo.trim().length < 10) {
      setErrorMotivo('Explica el motivo con al menos 10 caracteres, para que el cliente sepa qué corregir.');
      return;
    }
    setProcesando(rechazando.id);
    setErrorMotivo('');
    try {
      await recetasAdminApi.rechazar(rechazando.id, motivo.trim());
      setRechazando(null);
      setMotivo('');
      cargar();
    } catch (err) {
      setErrorMotivo(mensajeDeError(err, 'No se pudo rechazar la receta'));
    } finally {
      setProcesando(null);
    }
  }

  return (
    <div>
      {error && <div className="panel-aviso">{error}</div>}

      <div className="kpi-row">
        <div className="kpi kpi-principal">
          <span className="kpi-label">Recetas esperando revisión</span>
          <span className="kpi-valor">{lista.length}</span>
          <span className={`kpi-nota${lista.length > 0 ? ' es-alerta' : ''}`}>
            {lista.length > 0
              ? 'El pedido no avanza hasta aprobarlas'
              : 'No hay nada pendiente'}
          </span>
        </div>
      </div>

      <div className="table-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--texto-suave)' }}>
            Revisa que la receta sea legible, esté vigente y corresponda al medicamento pedido.
          </span>
          {/* BOTÓN DE AYUDA */}
          <button
            type="button"
            className="btn-chico"
            onClick={() => setAyudaAbierta(true)}
            title="Guía para validar recetas"
            style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid #3b82f6', color: '#3b82f6' }}
          >
            <i className="fa-solid fa-circle-question"></i> Guía
          </button>
        </div>
        <button className="btn-chico" onClick={cargar} disabled={cargando}>
          Actualizar
        </button>
      </div>

      <div className="table-card">
        {cargando ? (
          <p className="panel-cargando">Cargando recetas…</p>
        ) : lista.length === 0 ? (
          <p className="panel-vacio">
            No hay recetas pendientes de revisión. Buen trabajo.
          </p>
        ) : (
          <>
            <div className="tabla-scroll">
            <table className="data-table ajustada">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Medicamento</th>
                  <th>Cant.</th>
                  <th>Subida</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.codigoPedido}</strong>
                    </td>
                    <td>{r.nombreCliente}</td>
                    <td>{r.nombreProducto}</td>
                    <td>{r.cantidad}</td>
                    <td style={{ fontSize: 12.5 }}>{fechaHora(r.fechaSubida)}</td>
                    <td>
                      <div className="acciones-fila">
                        <button className="btn-chico" onClick={() => ver(r)}>
                          Ver receta
                        </button>
                        <button
                          className="btn-chico es-verde"
                          disabled={procesando === r.id}
                          onClick={() => aprobar(r)}
                        >
                          {procesando === r.id ? 'Guardando…' : 'Aprobar'}
                        </button>
                        <button
                          className="btn-chico es-rojo"
                          disabled={procesando === r.id}
                          onClick={() => {
                            setRechazando(r);
                            setMotivo('');
                            setErrorMotivo('');
                          }}
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="table-footer">
              {lista.length} {lista.length === 1 ? 'receta pendiente' : 'recetas pendientes'}
            </div>
          </>
        )}
      </div>

      {/* MODAL DE RECHAZO */}
      {rechazando && (
        <div className="modal-overlay" onClick={() => !procesando && setRechazando(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Rechazar receta</h2>
                <p className="modal-subtitle">
                  {rechazando.nombreProducto} · {rechazando.codigoPedido}
                </p>
              </div>
              <button className="modal-close" onClick={() => setRechazando(null)}>
                ×
              </button>
            </div>

            {errorMotivo && <div className="modal-error">{errorMotivo}</div>}

            <div className="form-field">
              <label htmlFor="motivo">Motivo del rechazo *</label>
              <textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={4}
                placeholder="Ej.: La receta no es legible en la zona de la dosis. Sube una foto más nítida."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--borde)',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--texto-suave)', marginTop: 8 }}>
              El cliente verá este mensaje y podrá subir una receta nueva.
            </p>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setRechazando(null)}
                disabled={procesando !== null}
              >
                Cancelar
              </button>
              <button
                className="btn-save"
                onClick={confirmarRechazo}
                disabled={procesando !== null}
                style={{ background: '#b91c1c' }}
              >
                {procesando !== null ? 'Guardando…' : 'Rechazar receta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GUÍA DE VALIDACIÓN */}
      {ayudaAbierta && (
        <div className="modal-overlay" onClick={() => setAyudaAbierta(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  <i className="fa-solid fa-file-medical" style={{ color: '#3b82f6', marginRight: 8 }}></i>
                  Guía para validar recetas
                </h2>
                <p className="modal-subtitle">Puntos clave antes de aprobar o rechazar un documento</p>
              </div>
              <button className="modal-close" onClick={() => setAyudaAbierta(false)}>
                ×
              </button>
            </div>

            <div style={{ fontSize: 13.5, color: 'var(--texto)', lineHeight: 1.6 }}>
              <ul style={{ paddingLeft: 20, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li>
                  <strong>Legibilidad:</strong> La receta debe ser clara. No debe tener tachaduras, borrones ni enmendaduras.
                </li>
                <li>
                  <strong>Vigencia:</strong> Verifica que la fecha de emisión no supere los <strong>30 días</strong> de antigüedad. Recetas vencidas no son válidas.
                </li>
                <li>
                  <strong>Prescriptor (Médico):</strong> Debe incluir obligatoriamente el nombre del médico, su firma, su sello y su número de <strong>CMP</strong> (Colegiatura).
                </li>
                <li>
                  <strong>Paciente:</strong> El nombre en la receta debe coincidir con el cliente de la tienda o con la persona autorizada a recoger el pedido.
                </li>
                <li>
                  <strong>Medicamento:</strong> El nombre, la concentración (ej. 500mg) y la cantidad prescrita deben coincidir exactamente con lo que se está vendiendo.
                </li>
                <li>
                  <strong>Posología:</strong> La indicación médica debe ser explícita (ej. "1 tableta cada 8 horas"). Dosis vagas como "según sea necesario" no son válidas para medicamentos controlados.
                </li>
              </ul>
            </div>

            <div className="modal-actions">
              <button className="btn-save" onClick={() => setAyudaAbierta(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
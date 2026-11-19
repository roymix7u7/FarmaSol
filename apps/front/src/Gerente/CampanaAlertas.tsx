import { useEffect, useRef, useState } from 'react';
import type { Alerta, DestinoAlerta } from './useAlertasPanel';

interface Props {
  alertas: Alerta[];
  nuevas: number;
  onAbrir: () => void;
  onIr: (destino: DestinoAlerta) => void;
}

/** Campana de la cabecera del panel con las alertas que piden acción. */
export function CampanaAlertas({ alertas, nuevas, onAbrir, onIr }: Props) {
  const [abierta, setAbierta] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierta) return;
    function fuera(e: MouseEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierta(false);
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierta(false);
    }
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierta]);

  function alternar() {
    if (!abierta) onAbrir();
    setAbierta((v) => !v);
  }

  return (
    <div className="campana" ref={caja}>
      <button
        className={`campana-btn${abierta ? ' abierta' : ''}`}
        onClick={alternar}
        aria-haspopup="true"
        aria-expanded={abierta}
        aria-label={nuevas > 0 ? `Notificaciones, ${nuevas} nuevas` : 'Notificaciones'}
      >
        <i className="fa-regular fa-bell"></i>
        {nuevas > 0 && <span className="campana-badge">{nuevas}</span>}
      </button>

      {abierta && (
        <div className="campana-panel" role="dialog" aria-label="Notificaciones">
          <div className="campana-cabecera">
            <strong>Notificaciones</strong>
            <span>{alertas.length === 0 ? 'Todo en orden' : `${alertas.length} por atender`}</span>
          </div>

          {alertas.length === 0 ? (
            <div className="campana-vacia">
              <i className="fa-regular fa-circle-check"></i>
              <p>No hay nada pendiente: stock, recetas y pedidos al día.</p>
            </div>
          ) : (
            <ul className="campana-lista">
              {alertas.map((a) => (
                <li key={a.clave}>
                  <button
                    className="campana-item"
                    onClick={() => {
                      setAbierta(false);
                      onIr(a.destino);
                    }}
                  >
                    <span className={`campana-icono es-${a.nivel}`}>
                      <i className={`fa-solid ${a.icono}`}></i>
                    </span>
                    <span className="campana-texto">
                      <strong>{a.titulo}</strong>
                      <span>{a.detalle}</span>
                    </span>
                    <i className="fa-solid fa-chevron-right campana-flecha" aria-hidden></i>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="campana-pie">Se actualiza cada minuto</div>
        </div>
      )}
    </div>
  );
}

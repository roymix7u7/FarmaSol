import { useRef, useState } from 'react';
import { mensajeDeError } from '../api/client';
import { recetasApi, validarArchivoReceta } from '../api/recetas';
import type { EstadoReceta } from '../api/recetas';

interface Props {
  idPedidoDetalle: number;
  /** null significa que el cliente todavía no ha subido ninguna receta. */
  estadoReceta: EstadoReceta | null;
  /** Se llama tras subir, para que el pedido se recargue con el estado nuevo. */
  onSubida: () => void;
}

const estilos: Record<EstadoReceta, { texto: string; bg: string; color: string; ayuda: string }> = {
  PENDIENTE_REVISION: {
    texto: 'Receta en revisión',
    bg: '#fef3c7',
    color: '#92400e',
    ayuda: 'Un químico farmacéutico la está revisando. Te avisaremos cuando esté lista.',
  },
  APROBADA: {
    texto: 'Receta aprobada',
    bg: '#d1fae5',
    color: '#047857',
    ayuda: 'Tu receta fue validada. El pedido continúa su curso.',
  },
  RECHAZADA: {
    texto: 'Receta rechazada',
    bg: '#fee2e2',
    color: '#b91c1c',
    ayuda: 'No pudimos validarla. Sube una nueva, legible y vigente.',
  },
};

/** Subida de la receta de una línea del pedido, con su estado actual. */
export function SubirReceta({ idPedidoDetalle, estadoReceta, onSubida }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  // Solo se puede subir si no hay receta o si la anterior fue rechazada.
  const puedeSubir = estadoReceta === null || estadoReceta === 'RECHAZADA';
  const info = estadoReceta ? estilos[estadoReceta] : null;

  async function alElegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const problema = validarArchivoReceta(archivo);
    if (problema) {
      setError(problema);
      e.target.value = '';
      return;
    }

    setError('');
    setSubiendo(true);
    try {
      await recetasApi.subir(idPedidoDetalle, archivo);
      onSubida();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo subir la receta. Inténtalo de nuevo.'));
    } finally {
      setSubiendo(false);
      // Se limpia para poder volver a elegir el mismo archivo si hizo falta.
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: '10px 12px',
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>
          Requiere receta médica
        </span>
        {info && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: info.bg,
              color: info.color,
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            {info.texto}
          </span>
        )}
      </div>

      <p style={{ fontSize: 12, color: '#78350f', margin: '6px 0 0' }}>
        {info
          ? info.ayuda
          : 'Sube una foto o el PDF de tu receta para que podamos despachar este producto.'}
      </p>

      {puedeSubir && (
        <>
          <input
            ref={inputRef}
            id={`receta-${idPedidoDetalle}`}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={alElegirArchivo}
            disabled={subiendo}
            style={{ display: 'none' }}
          />
          <label
            htmlFor={`receta-${idPedidoDetalle}`}
            style={{
              display: 'inline-block',
              marginTop: 10,
              padding: '7px 14px',
              background: subiendo ? '#d1d5db' : 'var(--verde)',
              color: '#fff',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: subiendo ? 'default' : 'pointer',
            }}
          >
            {subiendo
              ? 'Subiendo…'
              : estadoReceta === 'RECHAZADA'
                ? 'Subir otra receta'
                : 'Subir receta'}
          </label>
          <span style={{ fontSize: 11, color: '#92400e', marginLeft: 10 }}>
            PDF, JPG o PNG · máx. 5 MB
          </span>
        </>
      )}

      {error && (
        <p style={{ fontSize: 12, color: '#b91c1c', margin: '8px 0 0', fontWeight: 600 }}>
          {error}
        </p>
      )}
    </div>
  );
}

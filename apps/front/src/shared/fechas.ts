/**
 * Fechas en formato ISO (YYYY-MM-DD) usando la zona del usuario.
 *
 * No se usa toISOString(): esa función convierte a UTC, así que de noche en Perú
 * (UTC-5) devuelve el día siguiente. Una promoción creada a las 10pm arrancaba
 * "mañana" y salía como no vigente, y el reporte del día pedía un rango corrido.
 */
export function isoLocal(fecha: Date = new Date()) {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

/** Hoy, en la zona del usuario. */
export function hoyISO() {
  return isoLocal();
}

/** Hoy más `dias` días. Con días negativos, hacia atrás. */
export function diasDesdeHoy(dias: number) {
  const f = new Date();
  f.setDate(f.getDate() + dias);
  return isoLocal(f);
}

/** Hoy más un mes, para la fecha de fin por defecto de una promoción. */
export function enUnMesISO() {
  const f = new Date();
  f.setMonth(f.getMonth() + 1);
  return isoLocal(f);
}

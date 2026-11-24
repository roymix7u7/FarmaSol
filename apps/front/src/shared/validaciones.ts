/**
 * Reglas de los formularios. Son el espejo de las del backend
 * (validation/Reglas.java y model/enums/TipoDocumento.java): si cambias una,
 * cambia la otra, o el formulario aceptará algo que el servidor rechace.
 *
 * Validar aquí es solo para avisar antes y mejor; quien decide es el backend.
 */

export type TipoDocumento = 'DNI' | 'CARNET_EXTRANJERIA';

export interface InfoDocumento {
  valor: TipoDocumento;
  etiqueta: string;
  ayuda: string;
  largoMax: number;
  soloNumeros: boolean;
}

export const TIPOS_DOCUMENTO: InfoDocumento[] = [
  { valor: 'DNI', etiqueta: 'DNI', ayuda: '8 dígitos', largoMax: 8, soloNumeros: true },
  {
    valor: 'CARNET_EXTRANJERIA',
    etiqueta: 'Carné de extranjería',
    ayuda: 'De 9 a 12 letras o números',
    largoMax: 12,
    soloNumeros: false,
  },
];

export function infoDocumento(tipo: TipoDocumento): InfoDocumento {
  return TIPOS_DOCUMENTO.find((t) => t.valor === tipo) ?? TIPOS_DOCUMENTO[0];
}

/**
 * Limpia lo que se va escribiendo: el DNI solo admite dígitos y el carné solo
 * letras y números en mayúscula. Así el usuario no puede ni teclear un formato
 * que luego le van a rechazar.
 */
export function limpiarDocumento(tipo: TipoDocumento, valor: string) {
  const info = infoDocumento(tipo);
  const limpio = info.soloNumeros
    ? valor.replace(/[^0-9]/g, '')
    : valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return limpio.slice(0, info.largoMax);
}

export function validarDocumento(tipo: TipoDocumento, numero: string): string | null {
  if (!numero) return 'El número de documento es obligatorio';
  if (tipo === 'DNI') {
    return /^[0-9]{8}$/.test(numero) ? null : 'El DNI debe tener exactamente 8 dígitos';
  }
  return /^[A-Z0-9]{9,12}$/.test(numero)
    ? null
    : 'El carné de extranjería debe tener entre 9 y 12 caracteres, solo letras y números';
}

/** Celular peruano: 9 dígitos y empieza en 9. */
export function validarTelefono(telefono: string): string | null {
  if (!telefono) return 'El teléfono es obligatorio';
  return /^9[0-9]{8}$/.test(telefono)
    ? null
    : 'El teléfono debe ser un celular de 9 dígitos que empiece con 9';
}

export function limpiarTelefono(valor: string) {
  return valor.replace(/[^0-9]/g, '').slice(0, 9);
}

/** Al menos 8 caracteres, una mayúscula y un número. */
export function validarPassword(password: string): string | null {
  if (!password) return 'La contraseña es obligatoria';
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número';
  }
  return null;
}

/** Qué requisitos de la contraseña ya se cumplen, para mostrarlos mientras se escribe. */
export function requisitosPassword(password: string) {
  return [
    { texto: 'Al menos 8 caracteres', ok: password.length >= 8 },
    { texto: 'Una mayúscula', ok: /[A-Z]/.test(password) },
    { texto: 'Un número', ok: /[0-9]/.test(password) },
  ];
}

/**
 * Formato práctico de correo: algo, una arroba, un dominio con punto y una
 * terminación de al menos dos letras. No pretende cubrir todo el RFC; lo que se
 * escape, lo rechaza el backend.
 */
export function validarCorreo(correo: string): string | null {
  if (!correo) return 'El correo es obligatorio';
  return /^[^ @]+@[^ @]+[.][^ @]{2,}$/.test(correo) ? null : 'Escribe un correo válido, como nombre@correo.com';
}

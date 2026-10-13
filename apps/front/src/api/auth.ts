import { api } from './client';
import type { AuthResponse } from '../types';
import type { TipoDocumento } from '../shared/validaciones';

export interface RegistroClientePayload {
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  /** Número del documento elegido en tipoDocumento (no siempre es un DNI). */
  dni: string;
  correo: string;
  password: string;
  telefono: string;
}

export const authApi = {
  loginCliente(usuario: string, password: string) {
    return api
      .post<AuthResponse>('/auth/cliente/login', { usuario, password })
      .then((r) => r.data);
  },

  loginPersonal(usuario: string, password: string) {
    return api
      .post<AuthResponse>('/auth/personal/login', { usuario, password })
      .then((r) => r.data);
  },

  registrarCliente(payload: RegistroClientePayload) {
    return api.post<AuthResponse>('/auth/cliente/register', payload).then((r) => r.data);
  },
};

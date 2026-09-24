import { api } from './client';
import type { AuthResponse } from '../types';

export interface RegistroClientePayload {
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  password: string;
  telefono?: string;
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

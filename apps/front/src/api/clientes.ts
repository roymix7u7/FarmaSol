import { api } from './client';

export interface ClientePerfil {
  id: number;
  nombres: string;
  apellidos: string;
  usuario: string;
  correo: string;
  dni: string;
  telefono: string | null;
  activo: boolean;
  fechaRegistro: string;
}

export interface ClienteUpdatePayload {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string;
}

export const clientesApi = {
  miPerfil() {
    return api.get<ClientePerfil>('/clientes/me').then((r) => r.data);
  },

  actualizar(payload: ClienteUpdatePayload) {
    return api.put<ClientePerfil>('/clientes/me', payload).then((r) => r.data);
  },
};
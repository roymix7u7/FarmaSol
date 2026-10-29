import { api } from './client';

export type RolPersonal = 'GERENTE' | 'EMPLEADO';

export interface Personal {
  id: number;
  nombres: string;
  apellidos: string;
  usuario: string;
  correo: string;
  rol: RolPersonal;
  activo: boolean;
  creadoPorUsuario: string | null;
  fechaCreacion: string;
}

export interface PersonalPayload {
  nombres: string;
  apellidos: string;
  usuario: string;
  correo: string;
  /** Al editar se deja vacío para no cambiar la contraseña actual. */
  password?: string;
  rol: RolPersonal;
}

export const personalApi = {
  listar() {
    return api.get<Personal[]>('/personal').then((r) => r.data);
  },

  crear(payload: PersonalPayload) {
    return api.post<Personal>('/personal', payload).then((r) => r.data);
  },

  actualizar(id: number, payload: PersonalPayload) {
    return api.put<Personal>(`/personal/${id}`, payload).then((r) => r.data);
  },

  cambiarEstado(id: number, activo: boolean) {
    return api.patch<void>(`/personal/${id}/estado`, null, { params: { activo } });
  },
};

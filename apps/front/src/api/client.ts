import axios from 'axios';
import type { ApiError, TipoUsuario } from '../types';

/**
 * El panel y la tienda guardan su sesión por separado. Antes compartían una sola:
 * si en otra pestaña alguien entraba como cliente, el panel seguía mostrando al
 * gerente pero mandaba el token del cliente, y el servidor respondía "No tienes
 * permiso" en todas las secciones.
 */
export const SESIONES: Record<TipoUsuario, { token: string; user: string }> = {
  PERSONAL: { token: 'farmasol_personal_token', user: 'farmasol_personal_user' },
  CLIENTE: { token: 'farmasol_cliente_token', user: 'farmasol_cliente_user' },
};

/** Qué sesión usa la página actual: todo lo que está bajo /gerente es del panel. */
export function areaDe(pathname: string): TipoUsuario {
  return pathname.startsWith('/gerente') ? 'PERSONAL' : 'CLIENTE';
}

export function borrarSesion(tipo: TipoUsuario) {
  localStorage.removeItem(SESIONES[tipo].token);
  localStorage.removeItem(SESIONES[tipo].user);
}

export const api = axios.create({
  baseURL: 'http://localhost:8081/api', // Apuntando directo al puerto actual de Spring Boot
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(SESIONES[areaDe(window.location.pathname)].token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? '';
    const status: number | undefined = error.response?.status;
    // Sesión expirada / inválida en un endpoint protegido: cerrar sesión.
    if (status === 401 && !url.includes('/auth/')) {
      const path = window.location.pathname;
      const area = areaDe(path);
      borrarSesion(area);
      // Cada uno vuelve a su propio login: el personal no puede entrar por el de
      // clientes, ni al revés.
      const login = area === 'PERSONAL' ? '/gerente/login' : '/login';
      if (!path.startsWith(login)) {
        window.location.href = login;
      }
    }
    return Promise.reject(error);
  },
);

/** Extrae un mensaje legible de un error de axios. */
export function mensajeDeError(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor';
    }
    const data = error.response.data;
    if (data?.validaciones) {
      const primera = Object.values(data.validaciones)[0];
      if (primera) return primera;
    }
    return data?.mensaje ?? fallback;
  }
  return fallback;
}

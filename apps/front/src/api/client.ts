import axios from 'axios';
import type { ApiError } from '../types';

export const TOKEN_KEY = 'farmasol_token';
export const USER_KEY = 'farmasol_user';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
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
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/admin/login')) {
        window.location.href = '/login';
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

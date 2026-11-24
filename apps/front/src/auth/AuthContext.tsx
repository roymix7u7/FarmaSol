import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { authApi } from '../api/auth';
import type { RegistroClientePayload } from '../api/auth';
import { SESIONES, areaDe, borrarSesion } from '../api/client';
import type { AuthResponse, AuthUser, TipoUsuario } from '../types';

interface AuthContextValue {
  /** El usuario de la sesión de esta página: el personal en /gerente, el cliente en la tienda. */
  user: AuthUser | null;
  loginCliente: (usuario: string, password: string) => Promise<AuthUser>;
  loginPersonal: (usuario: string, password: string) => Promise<AuthUser>;
  registrarCliente: (payload: RegistroClientePayload) => Promise<AuthUser>;
  /** Cierra solo la sesión de esta página; la otra sigue abierta. */
  logout: () => void;
}

type Sesiones = Record<TipoUsuario, AuthUser | null>;

const AuthContext = createContext<AuthContextValue | null>(null);

function leerUsuarioGuardado(tipo: TipoUsuario): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESIONES[tipo].user);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function leerSesiones(): Sesiones {
  return { PERSONAL: leerUsuarioGuardado('PERSONAL'), CLIENTE: leerUsuarioGuardado('CLIENTE') };
}

/** Pasa la sesión de la versión anterior (una sola para todos) a su lugar nuevo. */
function migrarSesionAntigua() {
  try {
    const token = localStorage.getItem('farmasol_token');
    const raw = localStorage.getItem('farmasol_user');
    if (token && raw) {
      const tipo = (JSON.parse(raw) as AuthUser).tipo;
      if (SESIONES[tipo]) {
        localStorage.setItem(SESIONES[tipo].token, token);
        localStorage.setItem(SESIONES[tipo].user, raw);
      }
    }
  } catch {
    // Si estaba corrupta, simplemente se pide iniciar sesión otra vez.
  }
  localStorage.removeItem('farmasol_token');
  localStorage.removeItem('farmasol_user');
}

function guardarSesion(res: AuthResponse): AuthUser {
  const user: AuthUser = {
    tipo: res.tipo,
    rol: res.rol,
    uid: res.uid,
    nombres: res.nombres,
  };
  localStorage.setItem(SESIONES[res.tipo].token, res.token);
  localStorage.setItem(SESIONES[res.tipo].user, JSON.stringify(user));
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesiones, setSesiones] = useState<Sesiones>(() => {
    migrarSesionAntigua();
    return leerSesiones();
  });
  const area = areaDe(useLocation().pathname);

  // Si en otra pestaña se inicia o cierra sesión, esta se entera al instante, en
  // vez de seguir mostrando a un usuario cuyo token ya no es el guardado.
  useEffect(() => {
    const alCambiar = () => setSesiones(leerSesiones());
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    function entrar(res: AuthResponse) {
      const u = guardarSesion(res);
      setSesiones((s) => ({ ...s, [u.tipo]: u }));
      return u;
    }
    return {
      user: sesiones[area],
      loginCliente: async (usuario, password) => entrar(await authApi.loginCliente(usuario, password)),
      loginPersonal: async (usuario, password) => entrar(await authApi.loginPersonal(usuario, password)),
      registrarCliente: async (payload) => entrar(await authApi.registrarCliente(payload)),
      logout() {
        borrarSesion(area);
        setSesiones((s) => ({ ...s, [area]: null }));
      },
    };
  }, [sesiones, area]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}

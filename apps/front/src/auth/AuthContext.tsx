import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import type { RegistroClientePayload } from '../api/auth';
import { TOKEN_KEY, USER_KEY } from '../api/client';
import type { AuthResponse, AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loginCliente: (usuario: string, password: string) => Promise<AuthUser>;
  loginPersonal: (usuario: string, password: string) => Promise<AuthUser>;
  registrarCliente: (payload: RegistroClientePayload) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function leerUsuarioGuardado(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function guardarSesion(res: AuthResponse): AuthUser {
  const user: AuthUser = {
    tipo: res.tipo,
    rol: res.rol,
    uid: res.uid,
    nombres: res.nombres,
  };
  localStorage.setItem(TOKEN_KEY, res.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(leerUsuarioGuardado);

  const value = useMemo<AuthContextValue>(() => {
    async function loginCliente(usuario: string, password: string) {
      const u = guardarSesion(await authApi.loginCliente(usuario, password));
      setUser(u);
      return u;
    }
    async function loginPersonal(usuario: string, password: string) {
      const u = guardarSesion(await authApi.loginPersonal(usuario, password));
      setUser(u);
      return u;
    }
    async function registrarCliente(payload: RegistroClientePayload) {
      const u = guardarSesion(await authApi.registrarCliente(payload));
      setUser(u);
      return u;
    }
    function logout() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
    return { user, loginCliente, loginPersonal, registrarCliente, logout };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}

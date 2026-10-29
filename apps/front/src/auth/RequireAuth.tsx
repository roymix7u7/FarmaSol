import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { Rol } from '../types';

/** Protege rutas de cliente. Redirige a /login si no hay sesión. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user.tipo !== 'CLIENTE') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

/** Protege el panel interno. `roles` restringe qué roles de personal entran. */
export function RequireStaff({ children, roles }: { children: ReactNode; roles?: Rol[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.tipo !== 'PERSONAL') {
    return <Navigate to="/gerente/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user.rol)) {
    return <Navigate to="/gerente" replace />;
  }
  return <>{children}</>;
}

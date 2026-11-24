import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { catalogoApi } from '../api/catalogo';
import { carritoApi } from '../api/carrito';
import { EVENTO_CARRITO } from '../shared/compraPendiente';
import { ModalLoginRequerido } from '../shared/ModalLoginRequerido';
import type { Categoria } from '../types';
import '../Css/PublicLayout.css';

export function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [enCarrito, setEnCarrito] = useState(0);
  const [pideLogin, setPideLogin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const esCliente = user?.tipo === 'CLIENTE';

  useEffect(() => {
    catalogoApi.categoriasArbol().then(setCategorias).catch(() => setCategorias([]));
  }, []);

  // Contador del carrito: se pide al entrar y cada vez que algo se agrega.
  useEffect(() => {
    if (!esCliente) {
      setEnCarrito(0);
      return;
    }
    const actualizar = () =>
      carritoApi
        .ver()
        .then((c) => setEnCarrito(c.items.reduce((suma, i) => suma + i.cantidad, 0)))
        .catch(() => setEnCarrito(0));
    actualizar();
    window.addEventListener(EVENTO_CARRITO, actualizar);
    return () => window.removeEventListener(EVENTO_CARRITO, actualizar);
  }, [esCliente]);

  const cerrarModal = useCallback(() => setPideLogin(false), []);

  function onClickCarrito(e: React.MouseEvent) {
    if (!user) {
      e.preventDefault();
      setPideLogin(true);
    }
  }

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener('mousedown', onClickFuera);
    return () => document.removeEventListener('mousedown', onClickFuera);
  }, []);

  function onBuscar(e: React.FormEvent) {
    e.preventDefault();
    const q = busqueda.trim();
    navigate(q ? `/buscar?q=${encodeURIComponent(q)}` : '/');
  }

  return (
    <div className="pub">
      <header className="pub-header">
        <div className="pub-header-inner">
          <Link to="/" className="pub-logo" aria-label="FarmaSol - Inicio">
            <span className="pub-logo-sun">☀</span>
            <span className="pub-logo-text">
              Farma<span>SOL</span>
            </span>
            <span className="pub-logo-rx">Rx</span>
          </Link>

          <form className="pub-search" onSubmit={onBuscar} role="search">
            <input
              type="search"
              placeholder="¿Qué está buscando?"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar productos"
            />
            <button type="submit" aria-label="Buscar">
              🔍
            </button>
          </form>

          <div className="pub-header-actions">
            {user ? (
              <div className="pub-usermenu" ref={menuRef}>
                <button
                  className="pub-usermenu-btn"
                  onClick={() => setMenuAbierto((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuAbierto}
                >
                  <span className="pub-usermenu-avatar">
                    {user.nombres.charAt(0).toUpperCase()}
                  </span>
                  <span className="pub-usermenu-name">{user.nombres}</span>
                  <span aria-hidden>▾</span>
                </button>
                {menuAbierto && (
                  <div className="pub-usermenu-dropdown" role="menu">
                    <span className="pub-usermenu-title">Cuenta</span>
                    <Link to="/mis-pedidos" role="menuitem" onClick={() => setMenuAbierto(false)}>
                      Mis pedidos
                    </Link>
                    <Link to="/mi-perfil" role="menuitem" onClick={() => setMenuAbierto(false)}>
                      Mi perfil
                    </Link>
                    <button
                      className="pub-usermenu-logout"
                      role="menuitem"
                      onClick={() => {
                        logout();
                        setMenuAbierto(false);
                        navigate('/');
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="pub-login-link">
                <span className="pub-login-icon" aria-hidden>
                  👤
                </span>
                Iniciar Sesión
              </Link>
            )}

            <Link
              to="/carrito"
              className="pub-cart"
              aria-label={enCarrito > 0 ? `Mi carrito, ${enCarrito} productos` : 'Mi carrito'}
              onClick={onClickCarrito}
            >
              <span className="pub-cart-icono" aria-hidden>
                🛒
                {enCarrito > 0 && (
                  <span className="pub-cart-badge">{enCarrito > 99 ? '99+' : enCarrito}</span>
                )}
              </span>
              <span className="pub-cart-label">Mi carrito</span>
            </Link>
          </div>
        </div>

        <nav className="pub-nav" aria-label="Categorías">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'activo' : undefined)}>
            Inicio
          </NavLink>
          <NavLink to="/nosotros" className={({ isActive }) => (isActive ? 'activo' : undefined)}>
            Nosotros
          </NavLink>
          {categorias.map((c) => (
            <NavLink
              key={c.id}
              to={`/categoria/${c.slug}`}
              className={({ isActive }) => (isActive ? 'activo' : undefined)}
            >
              {c.nombre}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="pub-main">
        <Outlet />
      </main>

      {pideLogin && <ModalLoginRequerido onCerrar={cerrarModal} />}

      <footer className="pub-footer">
        <p>FarmaSol · Farmacia y Botica · Todos los productos con registro sanitario</p>
        {/* Única entrada al portal interno desde la web pública. */}
        <Link to="/gerente/login" className="pub-footer-staff">
          Acceso personal
        </Link>
      </footer>
    </div>
  );
}
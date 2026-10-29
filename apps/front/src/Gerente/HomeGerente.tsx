import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../Css/HomeGerente.css';
import { DashboardGerente } from './DashboardGerente';
import { InventarioGerente } from './InventarioGerente';
import { PedidosGerente } from './PedidosGerente';
import { ReportesGerente } from './ReportesGerente';
import { PersonalGerente } from './PersonalGerente';
import { PuntoVentaGerente } from './PuntoVentaGerente';
import { PromocionesGerente } from './PromocionesGerente';
import { RecetasGerente } from './RecetasGerente';

type Vista = 'resumen' | 'venta' | 'inventario' | 'pedidos' | 'reportes' | 'recetas' | 'promociones' | 'personal';

export function HomeGerente() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const esGerente = user?.rol === 'GERENTE';
  // El empleado de mostrador entra directo a vender; el gerente, al resumen.
  const [vistaActiva, setVistaActiva] = useState<Vista>(esGerente ? 'resumen' : 'venta');

  const handleCerrarSesion = () => {
    logout();
    navigate('/gerente/login');
  };

  const tituloVista: Record<Vista, string> = {
    resumen: 'Resumen General',
    venta: 'Punto de Venta',
    inventario: 'Gestión de Inventario',
    pedidos: 'Control de Pedidos y Ventas',
    reportes: 'Reportes',
    recetas: 'Recetas Pendientes',
    promociones: 'Promociones',
    personal: 'Personal y Roles',
  };

  return (
    <div className="dashboard-layout">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      ></link>

      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <img src="/img/farmsol.png" alt="FarmaSOL" />
          </div>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-item ${vistaActiva === 'resumen' ? 'active' : ''}`}
              onClick={() => setVistaActiva('resumen')}
            >
              <i className="fa-solid fa-chart-pie"></i> Resumen
            </button>
            <button
              className={`sidebar-item ${vistaActiva === 'venta' ? 'active' : ''}`}
              onClick={() => setVistaActiva('venta')}
            >
              <i className="fa-solid fa-cash-register"></i> Punto de Venta
            </button>
            <button
              className={`sidebar-item ${vistaActiva === 'inventario' ? 'active' : ''}`}
              onClick={() => setVistaActiva('inventario')}
            >
              <i className="fa-solid fa-boxes-stacked"></i> Inventario / CRUD
            </button>
            <button
              className={`sidebar-item ${vistaActiva === 'pedidos' ? 'active' : ''}`}
              onClick={() => setVistaActiva('pedidos')}
            >
              <i className="fa-solid fa-receipt"></i> Pedidos y Ventas
            </button>
            <button
              className={`sidebar-item ${vistaActiva === 'reportes' ? 'active' : ''}`}
              onClick={() => setVistaActiva('reportes')}
            >
              <i className="fa-solid fa-chart-line"></i> Reportes
            </button>
            <button
              className={`sidebar-item ${vistaActiva === 'recetas' ? 'active' : ''}`}
              onClick={() => setVistaActiva('recetas')}
            >
              <i className="fa-solid fa-file-medical"></i> Recetas
            </button>

            {esGerente && (
              <>
                <button
                  className={`sidebar-item ${vistaActiva === 'promociones' ? 'active' : ''}`}
                  onClick={() => setVistaActiva('promociones')}
                >
                  <i className="fa-solid fa-tags"></i> Promociones
                </button>
                <button
                  className={`sidebar-item ${vistaActiva === 'personal' ? 'active' : ''}`}
                  onClick={() => setVistaActiva('personal')}
                >
                  <i className="fa-solid fa-users"></i> Personal y Roles
                </button>
              </>
            )}
          </nav>
        </div>
        <button className="sidebar-logout" onClick={handleCerrarSesion}>
          <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
        </button>
      </aside>

      <main className="main-content">
        <div className="content-header">
          <h1 className="content-title">{tituloVista[vistaActiva]}</h1>
          <div className="content-user">
            <i className="fa-solid fa-bell bell"></i>
            <i className="fa-solid fa-user-circle"></i>
            <span>
              {esGerente ? 'Gerente' : 'Empleado'}: {user?.nombres}
            </span>
          </div>
        </div>

        {vistaActiva === 'resumen' && <DashboardGerente onIrA={setVistaActiva} />}
        {vistaActiva === 'venta' && <PuntoVentaGerente />}
        {vistaActiva === 'inventario' && <InventarioGerente />}
        {vistaActiva === 'pedidos' && <PedidosGerente />}
        {vistaActiva === 'reportes' && <ReportesGerente />}
        {vistaActiva === 'recetas' && <RecetasGerente />}
        {vistaActiva === 'promociones' && esGerente && <PromocionesGerente />}
        {vistaActiva === 'personal' && esGerente && <PersonalGerente />}
      </main>
    </div>
  );
}
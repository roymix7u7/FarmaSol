import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../Css/HomeGerente.css';
import { DashboardGerente } from './DashboardGerente';
import { InventarioGerente, type FiltroStock } from './InventarioGerente';
import { CampanaAlertas } from './CampanaAlertas';
import { useAlertasPanel, type DestinoAlerta } from './useAlertasPanel';
import { PedidosGerente } from './PedidosGerente';
import { ReportesGerente } from './ReportesGerente';
import { PersonalGerente } from './PersonalGerente';
import { PuntoVentaGerente } from './PuntoVentaGerente';
import { PromocionesGerente } from './PromocionesGerente';
import { RecetasGerente } from './RecetasGerente';
import { BannersGerente } from './BannersGerente';
import { IncidenciasGerente } from './IncidenciasGerente';
import { ModalReportarProblema } from './ModalReportarProblema';
import type { TipoIncidencia } from '../api/incidencias';

type Vista =
  | 'resumen'
  | 'venta'
  | 'inventario'
  | 'pedidos'
  | 'reportes'
  | 'recetas'
  | 'promociones'
  | 'banners'
  | 'incidencias'
  | 'personal';

interface ItemMenu {
  vista: Vista;
  icono: string;
  texto: string;
  titulo: string;
  descripcion: string;
}

/** Lo que hace la farmacia día a día: lo ven el empleado y el gerente. */
const OPERACION: ItemMenu[] = [
  { vista: 'resumen', icono: 'fa-chart-pie', texto: 'Resumen', titulo: 'Resumen general', descripcion: 'Cómo va la farmacia hoy y qué necesita atención.' },
  { vista: 'venta', icono: 'fa-cash-register', texto: 'Punto de Venta', titulo: 'Punto de venta', descripcion: 'Ventas en mostrador y cierre de caja.' },
  { vista: 'pedidos', icono: 'fa-receipt', texto: 'Pedidos y Ventas', titulo: 'Pedidos y ventas', descripcion: 'Pedidos de la tienda online y su estado.' },
  { vista: 'recetas', icono: 'fa-file-medical', texto: 'Recetas', titulo: 'Recetas por revisar', descripcion: 'Recetas médicas que los clientes subieron con su pedido.' },
  { vista: 'inventario', icono: 'fa-boxes-stacked', texto: 'Inventario', titulo: 'Inventario', descripcion: 'Productos, precios y stock disponible.' },
  { vista: 'reportes', icono: 'fa-chart-line', texto: 'Reportes', titulo: 'Reportes', descripcion: 'Ventas, productos más vendidos y stock por periodo.' },
];

/** El trabajador sigue aquí los problemas que le reportó al gerente. */
const MIS_REPORTES: ItemMenu = {
  vista: 'incidencias',
  icono: 'fa-flag',
  texto: 'Mis reportes',
  titulo: 'Mis reportes',
  descripcion: 'Problemas que le reportaste al gerente y su respuesta.',
};

/** Configuración de la tienda y del equipo: solo el gerente. */
const ADMINISTRACION: ItemMenu[] = [
  { vista: 'promociones', icono: 'fa-tags', texto: 'Promociones', titulo: 'Promociones', descripcion: 'Descuentos que se aplican solos al precio de la tienda.' },
  { vista: 'incidencias', icono: 'fa-flag', texto: 'Incidencias', titulo: 'Reportes del personal', descripcion: 'Problemas que el equipo te reportó desde el panel.' },
  { vista: 'banners', icono: 'fa-images', texto: 'Banners', titulo: 'Banners del inicio', descripcion: 'El carrusel que ven los clientes en la página principal.' },
  { vista: 'personal', icono: 'fa-users', texto: 'Personal y Roles', titulo: 'Personal y roles', descripcion: 'Cuentas del equipo y qué puede hacer cada una.' },
];

function fechaDeHoy() {
  const texto = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function HomeGerente() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const esGerente = user?.rol === 'GERENTE';
  // El empleado de mostrador entra directo a vender; el gerente, al resumen.
  const [vistaActiva, setVistaActiva] = useState<Vista>(esGerente ? 'resumen' : 'venta');
  // Con qué filtro abre el inventario cuando se llega desde una notificación.
  const [filtroInventario, setFiltroInventario] = useState<FiltroStock>('todos');
  const { alertas, nuevas, conteos, recargar, marcarVistas } = useAlertasPanel(esGerente);
  // Formulario "Reportar un problema": se abre desde la cabecera o el inventario.
  const [reportando, setReportando] = useState<TipoIncidencia | null>(null);
  const [versionReportes, setVersionReportes] = useState(0);
  const operacion = esGerente ? OPERACION : [...OPERACION, MIS_REPORTES];

  // Al cambiar de sección (p. ej. después de aprobar una receta) se refrescan
  // las alertas, para no esperar al minuto.
  useEffect(() => {
    recargar();
  }, [vistaActiva, recargar]);

  const handleCerrarSesion = () => {
    logout();
    navigate('/gerente/login');
  };

  function irA(vista: Vista) {
    if (vista === 'inventario') setFiltroInventario('todos');
    setVistaActiva(vista);
  }

  function irADestino(destino: DestinoAlerta) {
    if (destino.vista === 'inventario') {
      setFiltroInventario(destino.filtro);
      setVistaActiva('inventario');
    } else {
      setVistaActiva(destino.vista);
    }
  }

  const menu = esGerente ? [...OPERACION, ...ADMINISTRACION] : operacion;
  const actual = menu.find((m) => m.vista === vistaActiva) ?? OPERACION[0];
  const inicial = (user?.nombres ?? '?').charAt(0).toUpperCase();
  // Contadores junto al nombre de la sección en el menú.
  const contador: Partial<Record<Vista, number>> = {
    recetas: conteos.recetas,
    pedidos: conteos.pedidos,
    incidencias: conteos.incidencias,
  };

  function botones(items: ItemMenu[]) {
    return items.map((m) => (
      <button
        key={m.vista}
        className={`sidebar-item ${vistaActiva === m.vista ? 'active' : ''}`}
        onClick={() => irA(m.vista)}
        aria-current={vistaActiva === m.vista ? 'page' : undefined}
      >
        <i className={`fa-solid ${m.icono}`}></i> {m.texto}
        {(contador[m.vista] ?? 0) > 0 && (
          <span className="sidebar-contador" aria-label={`${contador[m.vista]} pendientes`}>
            {contador[m.vista]}
          </span>
        )}
      </button>
    ));
  }

  return (
    <div className="dashboard-layout">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      ></link>

      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <img src="/img/farmsol-transparente.png" alt="FarmaSOL" />
          </div>
          <nav className="sidebar-nav" aria-label="Secciones del panel">
            <span className="sidebar-seccion">Operación</span>
            {botones(operacion)}
            {esGerente && (
              <>
                <span className="sidebar-seccion">Administración</span>
                {botones(ADMINISTRACION)}
              </>
            )}
          </nav>
        </div>

        <div className="sidebar-pie">
          <div className="sidebar-usuario">
            <span className="avatar-inicial" aria-hidden>
              {inicial}
            </span>
            <div className="sidebar-usuario-texto">
              <strong>{user?.nombres}</strong>
              <span>{esGerente ? 'Gerente' : 'Empleado'}</span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleCerrarSesion}>
            <i className="fa-solid fa-right-from-bracket"></i> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-header">
          <div>
            <h1 className="content-title">{actual.titulo}</h1>
            <p className="content-descripcion">{actual.descripcion}</p>
          </div>
          <div className="content-user">
            <span className="content-fecha">
              <i className="fa-regular fa-calendar"></i> {fechaDeHoy()}
            </span>
            {!esGerente && (
              <button className="btn-reportar" onClick={() => setReportando('OTRO')}>
                <i className="fa-solid fa-flag"></i> Reportar al gerente
              </button>
            )}
            <CampanaAlertas
              alertas={alertas}
              nuevas={nuevas}
              onAbrir={marcarVistas}
              onIr={irADestino}
            />
            <span className={`rol-pill ${esGerente ? 'es-gerente' : ''}`}>
              {esGerente ? 'Gerente' : 'Empleado'}
            </span>
          </div>
        </div>

        {vistaActiva === 'resumen' && (
          <DashboardGerente
            // "Ver inventario" desde el stock bajo abre ya filtrado en los que faltan.
            onIrA={(v) =>
              v === 'inventario' ? irADestino({ vista: 'inventario', filtro: 'por-agotar' }) : irA(v)
            }
          />
        )}
        {vistaActiva === 'venta' && <PuntoVentaGerente />}
        {vistaActiva === 'inventario' && (
          <InventarioGerente
            key={filtroInventario}
            filtroInicial={filtroInventario}
            onReportar={() => setReportando('STOCK')}
          />
        )}
        {vistaActiva === 'pedidos' && <PedidosGerente />}
        {vistaActiva === 'reportes' && <ReportesGerente />}
        {vistaActiva === 'recetas' && <RecetasGerente />}
        {vistaActiva === 'promociones' && esGerente && <PromocionesGerente />}
        {vistaActiva === 'banners' && esGerente && <BannersGerente />}
        {vistaActiva === 'personal' && esGerente && <PersonalGerente />}
        {vistaActiva === 'incidencias' && (
          <IncidenciasGerente
            esGerente={esGerente}
            onReportar={() => setReportando('OTRO')}
            onCambio={recargar}
            version={versionReportes}
          />
        )}
      </main>

      {reportando && (
        <ModalReportarProblema
          tipoInicial={reportando}
          onCerrar={() => setReportando(null)}
          onEnviado={() => {
            setVersionReportes((v) => v + 1);
            recargar();
          }}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { NuevaVenta } from './puntoVenta/NuevaVenta';
import { VentasDelDia } from './puntoVenta/VentasDelDia';
import '../Css/Dashboard.css';
import '../Css/PuntoVenta.css';

type Pestaña = 'nueva' | 'dia';

/** Punto de venta: cobro en el mostrador y cuadre de caja del día. */
export function PuntoVentaGerente() {
  const esGerente = useAuth().user?.rol === 'GERENTE';
  const [pestaña, setPestaña] = useState<Pestaña>('nueva');
  // Sube con cada venta registrada o anulada, para que la caja se recargue.
  const [version, setVersion] = useState(0);
  const refrescar = () => setVersion((v) => v + 1);

  return (
    <div>
      <div className="pv-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={pestaña === 'nueva'}
          className={`pv-tab${pestaña === 'nueva' ? ' activa' : ''}`}
          onClick={() => setPestaña('nueva')}
        >
          <i className="fa-solid fa-cash-register" style={{ marginRight: 7 }}></i>
          Nueva venta
        </button>
        <button
          role="tab"
          aria-selected={pestaña === 'dia'}
          className={`pv-tab${pestaña === 'dia' ? ' activa' : ''}`}
          onClick={() => setPestaña('dia')}
        >
          <i className="fa-solid fa-receipt" style={{ marginRight: 7 }}></i>
          {esGerente ? 'Ventas y caja del día' : 'Mis ventas y caja'}
        </button>
      </div>

      {/* Se mantienen montadas las dos: cambiar de pestaña no debe perder la venta a medias. */}
      <div hidden={pestaña !== 'nueva'}>
        <NuevaVenta onVentaRegistrada={refrescar} />
      </div>
      <div hidden={pestaña !== 'dia'}>
        <VentasDelDia esGerente={esGerente} version={version} onCambio={refrescar} />
      </div>
    </div>
  );
}

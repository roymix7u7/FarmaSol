import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth, RequireStaff } from './auth/RequireAuth';
import { PublicLayout } from './layout/PublicLayout';
import { HomeCliente } from './Cliente/HomeCliente';
import { EnConstruccion, Nosotros } from './shared/EnConstruccion';
import { LoginCliente } from './Cliente/LoginCliente';
import { RegistroCliente } from './Cliente/RegistroCliente';
import { LoginGerente } from './Gerente/LoginGerente';
import { HomeGerente } from './Gerente/HomeGerente';
import { ForgotPasswordGerente } from './Gerente/ForgotPasswordGerente';
import { CategoriaCliente } from './Cliente/CategoriaCliente';
import { CarritoCliente } from './Cliente/CarritoCliente';
import { EntregaCliente } from './Cliente/EntregaCliente';
import { PagoCliente } from './Cliente/PagoCliente';
import { PerfilCliente } from './Cliente/PerfilCliente';
import { PedidosCliente } from './Cliente/PedidosCliente';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Autenticación (sin layout) */}
          <Route path="/login" element={<LoginCliente />} />
          <Route path="/registro" element={<RegistroCliente />} />
          <Route path="/gerente/login" element={<LoginGerente />} />
          <Route path="/gerente/forgot-password" element={<ForgotPasswordGerente />} />

          {/* Checkout (con su propio header) */}
          <Route path="/carrito" element={<RequireAuth><CarritoCliente /></RequireAuth>} />
          <Route path="/cliente/entrega" element={<RequireAuth><EntregaCliente /></RequireAuth>} />
          <Route path="/cliente/pago" element={<RequireAuth><PagoCliente /></RequireAuth>} />

          {/* Tienda pública */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomeCliente />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/categoria/:slug" element={<CategoriaCliente />} />
            <Route path="/buscar" element={<EnConstruccion titulo="Resultados de búsqueda" />} />
            <Route path="/mi-perfil" element={<RequireAuth><PerfilCliente /></RequireAuth>} />
            <Route path="/mis-pedidos" element={<RequireAuth><PedidosCliente /></RequireAuth>} />
          </Route>

          {/* Panel del Gerente */}
          <Route path="/gerente" element={<RequireStaff><HomeGerente /></RequireStaff>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
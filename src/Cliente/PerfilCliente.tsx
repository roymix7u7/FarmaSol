import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { clientesApi, type ClientePerfil } from '../api/clientes';
import { mensajeDeError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function PerfilCliente() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState<ClientePerfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');

  useEffect(() => {
    clientesApi
      .miPerfil()
      .then((p) => {
        setPerfil(p);
        setNombres(p.nombres || '');
        setApellidos(p.apellidos || '');
        setCorreo(p.correo || '');
        setTelefono(p.telefono || '');
      })
      .catch(() => setError('No se pudo cargar el perfil'))
      .finally(() => setCargando(false));
  }, []);

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setExito('');
    setGuardando(true);
    try {
      const actualizado = await clientesApi.actualizar({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: correo.trim(),
        telefono: telefono.trim() || undefined,
      });
      setPerfil(actualizado);
      setExito('¡Perfil actualizado correctamente!');
      setTimeout(() => setExito(''), 2500);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo actualizar el perfil'));
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--texto-suave)' }}>
        Cargando perfil…
      </div>
    );
  }

  if (!perfil) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 12 }}>No se encontró el perfil</h2>
        <Link to="/" style={{ color: 'var(--verde)', fontWeight: 600 }}>
          ← Volver a la tienda
        </Link>
      </div>
    );
  }

  const inicial = (nombres.charAt(0) || 'C').toUpperCase();
  const fechaFormato = new Date(perfil.fechaRegistro).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* ============ SIDEBAR ============ */}
        <aside>
          <div
            style={{
              background: 'var(--blanco)',
              border: '1px solid var(--borde)',
              borderRadius: 12,
              padding: '28px 20px',
              textAlign: 'center',
              boxShadow: 'var(--sombra)',
              position: 'sticky',
              top: 24,
            }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: 'var(--verde)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                fontSize: 38,
                fontWeight: 700,
              }}
            >
              {inicial}
            </div>
            <h2 style={{ fontSize: 17, marginBottom: 4 }}>
              {perfil.nombres} {perfil.apellidos}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: 'var(--texto-suave)',
                marginBottom: 24,
                wordBreak: 'break-all',
              }}
            >
              {perfil.correo}
            </p>

            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 16px',
                marginBottom: 8,
                borderRadius: 8,
                border: 'none',
                background: 'var(--verde)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <i className="fa-solid fa-user-pen"></i> Mi Perfil
            </button>

            <button
              type="button"
              onClick={() => navigate('/mis-pedidos')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--borde)',
                background: 'var(--blanco)',
                color: 'var(--texto)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <i className="fa-solid fa-box"></i> Mis Pedidos
            </button>
          </div>
        </aside>

        {/* ============ FORMULARIO ============ */}
        <main>
          <div
            style={{
              background: 'var(--blanco)',
              border: '1px solid var(--borde)',
              borderRadius: 12,
              padding: 30,
              boxShadow: 'var(--sombra)',
            }}
          >
            <h1 style={{ fontSize: 22, marginBottom: 6 }}>Mi Perfil</h1>
            <p style={{ fontSize: 14, color: 'var(--texto-suave)', marginBottom: 24 }}>
              Administra tu información personal.
            </p>

            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '12px 16px',
                  borderRadius: 8,
                  marginBottom: 20,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            {exito && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #d1fae5',
                  color: '#047857',
                  padding: '12px 16px',
                  borderRadius: 8,
                  marginBottom: 20,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <i className="fa-solid fa-circle-check" style={{ marginRight: 8 }}></i>
                {exito}
              </div>
            )}

            <form onSubmit={handleGuardar}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 18,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Nombres *</label>
                  <input
                    type="text"
                    required
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    DNI / Documento{' '}
                    <span style={{ color: 'var(--texto-suave)', fontWeight: 400 }}>
                      (no editable)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={perfil.dni}
                    disabled
                    style={{ ...inputStyle, background: '#f3f4f6', cursor: 'not-allowed' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    Fecha de registro{' '}
                    <span style={{ color: 'var(--texto-suave)', fontWeight: 400 }}>
                      (no editable)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={fechaFormato}
                    disabled
                    style={{ ...inputStyle, background: '#f3f4f6', cursor: 'not-allowed' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Correo electrónico *</label>
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Teléfono / Celular</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+51 987 654 321"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 12,
                  marginTop: 28,
                  paddingTop: 20,
                  borderTop: '1px solid var(--borde)',
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 8,
                    border: '1px solid var(--borde)',
                    background: 'var(--blanco)',
                    color: 'var(--texto)',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    padding: '10px 26px',
                    border: 'none',
                    borderRadius: 8,
                    background: guardando ? '#d1d5db' : 'var(--verde)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: guardando ? 'not-allowed' : 'pointer',
                  }}
                >
                  {guardando ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  border: '1px solid var(--borde)',
  borderRadius: 8,
  fontSize: 14,
  color: 'var(--texto)',
  background: 'var(--blanco)',
  outline: 'none',
  fontFamily: 'inherit',
};
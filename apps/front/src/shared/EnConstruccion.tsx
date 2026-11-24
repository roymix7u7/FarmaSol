export function EnConstruccion({ titulo }: { titulo: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 16px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{titulo}</h1>
      <p style={{ color: 'var(--texto-suave)' }}>Esta sección estará disponible en la próxima entrega.</p>
    </div>
  );
}

export function Nosotros() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Banner */}
      <section
        style={{
          background: 'linear-gradient(120deg, #e9f7f0, #eaf1ff)',
          borderRadius: 16,
          padding: '56px 32px',
          textAlign: 'center',
          marginBottom: 40,
        }}
      >
        <h1 style={{ fontSize: 34, marginBottom: 10, letterSpacing: 0.5 }}>Nosotros</h1>
      </section>

      {/* Sobre Nosotros */}
      <h2
        style={{
          fontSize: 26,
          textAlign: 'center',
          marginBottom: 32,
          color: 'var(--texto)',
        }}
      >
        Sobre Nosotros
      </h2>

      {/* Misión */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 32, alignItems: 'flex-start' }}>
        <div
          style={{
            fontSize: 40,
            flexShrink: 0,
            width: 60,
            textAlign: 'center',
          }}
        >
          🚀
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Nuestra Misión:</h3>
          <p style={{ color: 'var(--texto-suave)', lineHeight: 1.6, fontSize: 14.5 }}>
            Garantizar el acceso rápido, seguro y confiable a productos farmacéuticos y de bienestar
            para todos los hogares, ofreciendo una experiencia digital intuitiva, precios competitivos
            y un servicio enfocado en el bienestar y la salud de nuestros clientes.
          </p>
        </div>
      </div>

      {/* Visión */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 32, alignItems: 'flex-start' }}>
        <div
          style={{
            fontSize: 40,
            flexShrink: 0,
            width: 60,
            textAlign: 'center',
          }}
        >
          🔭
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Nuestra Visión:</h3>
          <p style={{ color: 'var(--texto-suave)', lineHeight: 1.6, fontSize: 14.5 }}>
            Consolidarnos como la plataforma digital farmacéutica de referencia a nivel local,
            destacada por su innovación tecnológica, eficiencia operativa, seguridad en las
            transacciones y un firme compromiso con la salud de la comunidad.
          </p>
        </div>
      </div>

      {/* Valores */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div
          style={{
            fontSize: 40,
            flexShrink: 0,
            width: 60,
            textAlign: 'center',
          }}
        >
          🤝
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Valores principales</h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              color: 'var(--texto-suave)',
              lineHeight: 1.7,
              fontSize: 14.5,
            }}
          >
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: 'var(--texto)' }}>• Compromiso con la Salud:</strong>{' '}
              Priorizamos el bienestar y la seguridad de cada usuario en la adquisición de sus
              productos médicos.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: 'var(--texto)' }}>• Innovación y Accesibilidad:</strong>{' '}
              Utilizamos tecnología moderna para hacer que la gestión y compra de medicamentos sea
              fácil y rápida para cualquier persona.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: 'var(--texto)' }}>• Confianza y Transparencia:</strong>{' '}
              Garantizamos procesos claros, desde el registro de usuarios y pedidos hasta la entrega
              del producto.
            </li>
            <li>
              <strong style={{ color: 'var(--texto)' }}>• Eficiencia:</strong> Optimizamos cada
              proceso, desde la interfaz de usuario hasta la arquitectura de backend, para ofrecer
              una respuesta ágil y sin fricciones.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
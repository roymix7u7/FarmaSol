import { useEffect, useState } from 'react';
import { catalogoApi } from '../api/catalogo';
import { api, mensajeDeError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Categoria, Producto } from '../types';
import '../Css/InventarioGerente.css';

interface ProductoForm {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: string;
  stock: string;
  idCategoria: string;
  subcategoria: string;
  imagenUrl: string;
  marca: string;
  presentacion: string;
  registroSanitario: string;
  requiereReceta: boolean;
}

const FORM_VACIO: ProductoForm = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '',
  idCategoria: '',
  subcategoria: '',
  imagenUrl: '',
  marca: '',
  presentacion: '',
  registroSanitario: '',
  requiereReceta: false,
};

export function InventarioGerente() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const { user } = useAuth();
  const puedeEditar = user?.rol === 'GERENTE';

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  
  // Extrae automáticamente las subcategorías únicas que ya están guardadas en los productos de la BD
  const subcategoriasPersonalizadas = Array.from(
    new Set(productos.map((p) => p.subcategoria).filter(Boolean))
  ) as string[];

  // Estados para manejar el modo de agregar nueva subcategoría desde el select
  const [modoNuevaSubcat, setModoNuevaSubcat] = useState(false);
  const [tempNuevaSubcat, setTempNuevaSubcat] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState<ProductoForm>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  // Estados para Drag & Drop y Galería
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [dragActivo, setDragActivo] = useState(false);
  const [errorImagen, setErrorImagen] = useState('');
  const [imagenesDisponibles, setImagenesDisponibles] = useState<string[]>([]);
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [hoveredImg, setHoveredImg] = useState<string | null>(null);

  // Estados para el Modal "Contactar Admin"
  const [modalAdminAbierto, setModalAdminAbierto] = useState(false);
  const [enviadoAlerta, setEnviadoAlerta] = useState(false);
  const [tipoIncidencia, setTipoIncidencia] = useState('Discrepancia física de stock en anaquel');
  const [skuRelacionado, setSkuRelacionado] = useState('');
  const [observacion, setObservacion] = useState('');

  useEffect(() => {
    cargarDatos();
    cargarImagenes();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    try {
      const [prods, cats] = await Promise.all([
        catalogoApi.productos(),
        catalogoApi.categoriasArbol(),
      ]);
      setProductos(prods);
      setCategorias(cats);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron cargar los datos'));
    } finally {
      setCargando(false);
    }
  }

  async function cargarImagenes() {
    try {
      const res = await api.get('/productos/imagenes-disponibles');
      setImagenesDisponibles(res.data);
    } catch {
      console.log('No se pudieron cargar las imágenes');
    }
  }

  async function eliminarImagen(url: string) {
    const confirmar = window.confirm('¿Estás seguro de que deseas eliminar esta imagen del sistema? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    try {
      const nombreArchivo = url.split('/').pop();
      await api.delete(`/productos/imagenes/${nombreArchivo}`);
      await cargarImagenes();
      if (form.imagenUrl === url) {
        actualizar('imagenUrl', '');
      }
    } catch (err) {
      alert('No se pudo eliminar la imagen.');
    }
  }

  function categoriasPlanas(cats: Categoria[]): Categoria[] {
    const out: Categoria[] = [];
    const recorrer = (lista: Categoria[], profundidad: number) => {
      lista.forEach((c) => {
        out.push({ ...c, nombre: `${'— '.repeat(profundidad)}${c.nombre}` });
        if (c.subcategorias?.length) recorrer(c.subcategorias, profundidad + 1);
      });
    };
    recorrer(cats, 0);
    return out;
  }

  function abrirCrear() {
    setForm(FORM_VACIO);
    setModoNuevaSubcat(false);
    setTempNuevaSubcat('');
    setErrorForm('');
    setErrorImagen('');
    setModalAbierto(true);
  }

  function abrirEditar(p: Producto) {
    setForm({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: String(p.precio),
      stock: String(p.stock),
      idCategoria: String(p.idCategoria),
      subcategoria: p.subcategoria || "",
      imagenUrl: p.imagenUrl || '',
      marca: p.marca || '',
      presentacion: p.presentacion || '',
      registroSanitario: p.registroSanitario || '',
      requiereReceta: p.requiereReceta,
    });
    setModoNuevaSubcat(false);
    setTempNuevaSubcat('');
    setErrorForm('');
    setErrorImagen('');
    setModalAbierto(true);
  }

  function actualizar<K extends keyof ProductoForm>(campo: K, valor: ProductoForm[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function subirArchivo(file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['jpg', 'jpeg', 'png', 'webp', 'jfif'].includes(extension)) {
      setErrorImagen('Solo se permiten imágenes JPG, PNG, WEBP o JFIF.');
      return;
    }

    setSubiendoImagen(true);
    setErrorImagen('');
    
    const formData = new FormData();
    formData.append('archivo', file);

    try {
      const res = await api.post('/productos/upload-imagen', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      actualizar('imagenUrl', res.data.url);
      await cargarImagenes();
    } catch (err) {
      setErrorImagen('No se pudo subir la imagen. Intenta de nuevo.');
    } finally {
      setSubiendoImagen(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActivo(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      subirArchivo(e.dataTransfer.files[0]);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForm('');

    if (!form.nombre.trim()) return setErrorForm('El nombre es obligatorio');
    if (!form.precio || Number(form.precio) <= 0) return setErrorForm('El precio debe ser mayor a 0');
    if (!form.stock || Number(form.stock) < 0) return setErrorForm('El stock no puede ser negativo');
    if (!form.idCategoria) return setErrorForm('Debes elegir una categoría');

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio: Number(form.precio),
      stock: Number(form.stock),
      idCategoria: Number(form.idCategoria),
      subcategoria: form.subcategoria.trim() || null,
      imagenUrl: form.imagenUrl.trim() || null,
      marca: form.marca.trim() || null,
      presentacion: form.presentacion.trim() || null,
      registroSanitario: form.registroSanitario.trim() || null,
      requiereReceta: form.requiereReceta,
    };

    setGuardando(true);
    try {
      if (form.id) {
        await api.put(`/productos/${form.id}`, payload);
      } else {
        await api.post('/productos', payload);
      }
      await cargarDatos();
      setModalAbierto(false);
    } catch (err) {
      setErrorForm(mensajeDeError(err, 'No se pudo guardar el producto'));
    } finally {
      setGuardando(false);
    }
  }

  const filtrados = productos.filter((p) =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const estadoStock = (stock: number) => {
    if (stock === 0) return { texto: 'Agotado', clase: 'badge-red' };
    if (stock < 10) return { texto: 'Por Agotar', clase: 'badge-yellow' };
    return { texto: 'En Stock', clase: 'badge-green' };
  };

  const handleEnviarAlertaAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setEnviadoAlerta(true);
  };

  return (
    <>
      <div className="table-card">
        <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <input
              className="search-input"
              placeholder="Buscar medicamento por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ flex: 1 }}
            />
            {puedeEditar ? (
              <button className="btn-primary" onClick={abrirCrear}>
                <i className="fa-solid fa-plus"></i> Nuevo Producto
              </button>
            ) : (
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                <i className="fa-solid fa-lock" style={{ marginRight: 6 }}></i>
                Solo lectura: gestión exclusiva del administrador
              </span>
            )}
          </div>

          <button 
            type="button"
            onClick={() => {
              setEnviadoAlerta(false);
              setObservacion('');
              setModalAdminAbierto(true);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fff',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            📞 Contactar Admin
          </button>
        </div>

        {error && <div style={{ padding: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}

        {cargando ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Cargando...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Medicamento</th>
                <th>Categoría</th>
                <th>Subcategoría</th>
                <th>Stock</th>
                <th>Precio</th>
                <th>Estado</th>
                {puedeEditar && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((prod) => {
                const estado = estadoStock(prod.stock);
                return (
                  <tr key={prod.id}>
                    <td>#{String(prod.id).padStart(3, '0')}</td>
                    <td>{prod.nombre}</td>
                    <td>{prod.nombreCategoria || 'Sin categoría'}</td>
                    <td style={{ color: prod.subcategoria ? '#059669' : '#9ca3af', fontWeight: prod.subcategoria ? 600 : 400 }}>
                      {prod.subcategoria || '—'}
                    </td>
                    <td>{prod.stock} und.</td>
                    <td>S/ {prod.precioFinal.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                    </td>
                    {puedeEditar && (
                      <td>
                        <i
                          className="fa-solid fa-pencil action-icon"
                          onClick={() => abrirEditar(prod)}
                        ></i>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="table-footer">
          <span>Mostrando {filtrados.length} producto(s)</span>
        </div>
      </div>

      {/* ============ MODAL CONTACTAR ADMIN ============ */}
      {modalAdminAbierto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: 20, width: '100%', maxWidth: 560,
            padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative'
          }}>
            {!enviadoAlerta ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      📞 Solicitar Asistencia de Administrador
                    </h3>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                      Envía una alerta prioritaria al supervisor de turno en tienda.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setModalAdminAbierto(false)}
                    style={{ backgroundColor: '#f3f4f6', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 14, cursor: 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                    Supervisor activo:
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>
                    Paolo (Admin General) • Canal interno conectado
                  </span>
                </div>

                <form onSubmit={handleEnviarAlertaAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                      Tipo de Incidencia *
                    </label>
                    <select 
                      value={tipoIncidencia}
                      onChange={(e) => setTipoIncidencia(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, backgroundColor: '#fff', color: '#111827' }}
                    >
                      <option value="Discrepancia física de stock en anaquel">Discrepancia física de stock en anaquel</option>
                      <option value="Error en validación de receta médica">Error en validación de receta médica</option>
                      <option value="Problema con el sistema de caja o pago">Problema con el sistema de caja o pago</option>
                      <option value="Otro motivo operativo">Otro motivo operativo</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                      N° de Orden o SKU relacionado
                    </label>
                    <input 
                      type="text"
                      value={skuRelacionado}
                      onChange={(e) => setSkuRelacionado(e.target.value)}
                      placeholder="Ej. #MED-103 [Crema Alma Secret]"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                      Observación / Motivo del llamado *
                    </label>
                    <textarea 
                      rows={3}
                      required
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      placeholder="Detalla brevemente el motivo para que el admin acuda o responda..."
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                    <button 
                      type="button" 
                      onClick={() => setModalAdminAbierto(false)}
                      style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      style={{ padding: '10px 24px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)' }}
                    >
                      🚨 Enviar Alerta
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ width: 64, height: 64, backgroundColor: '#d1fae5', color: '#059669', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                  ✓
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
                  Alerta notificada al Administrador
                </h3>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                  El mensaje de soporte fue enviado con prioridad alta al supervisor en turno.
                </p>

                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, textAlign: 'left', marginBottom: 24, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Supervisor asignado:</span>
                    <strong style={{ color: '#059669' }}>Paolo (Admin General)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Tipo de Incidencia:</span>
                    <strong style={{ color: '#1e293b' }}>{tipoIncidencia}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Canal de respuesta:</span>
                    <strong style={{ color: '#059669' }}>Terminal Operativo EMP-02 (En espera)</strong>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setModalAdminAbierto(false)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
                >
                  Entendido, volver a inventario
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ MODAL DE PRODUCTO (CREAR / EDITAR) ============ */}
      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {form.id ? 'Editar Medicamento' : 'Agregar Nuevo Medicamento'}
                </h2>
                <p className="modal-subtitle">
                  Ingresa los datos clínicos y comerciales del producto.
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => !guardando && setModalAbierto(false)}
                type="button"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form className="modal-form" onSubmit={guardar}>
              {errorForm && <div className="modal-error">{errorForm}</div>}

              <div className="form-field full">
                <label>Nombre comercial y concentración *</label>
                <input
                  type="text"
                  placeholder="Ej: Paracetamol 500mg (Caja x 20 tabletas)"
                  value={form.nombre}
                  onChange={(e) => actualizar('nombre', e.target.value)}
                  required
                />
              </div>

              <div className="form-field full">
                <label>Descripción</label>
                <textarea
                  placeholder="Descripción breve del producto"
                  value={form.descripcion}
                  onChange={(e) => actualizar('descripcion', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Categoría *</label>
                <select
                  value={form.idCategoria}
                  onChange={(e) => actualizar('idCategoria', e.target.value)}
                  required
                >
                  <option value="">— Elegir —</option>
                  {categoriasPlanas(categorias).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Laboratorio / Marca</label>
                <input
                  type="text"
                  placeholder="Ej: Genfar, Bayer..."
                  value={form.marca}
                  onChange={(e) => actualizar('marca', e.target.value)}
                />
              </div>

              {/* Selector con opción integrada "Agregar nueva subcategoría" al final */}
              <div className="form-field">
                <label>Subcategoría *</label>
                
                {!modoNuevaSubcat ? (
                  <select
                    value={form.subcategoria}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__NUEVA__') {
                        setModoNuevaSubcat(true);
                        setTempNuevaSubcat('');
                      } else {
                        actualizar('subcategoria', val);
                      }
                    }}
                    required
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff' }}
                  >
                    <option value="">— Seleccionar subcategoría —</option>
                    {Array.from(new Set(["Pañales", "Toallitas Húmedas", "Analgésicos", "Antibióticos", "Antiinflamatorios", "Pasta Dental", ...subcategoriasPersonalizadas])).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                    <option value="__NUEVA__" style={{ fontWeight: 600, color: '#059669' }}>
                      + Agregar nueva subcategoría...
                    </option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Escribe el nombre de la nueva subcategoría..."
                      value={tempNuevaSubcat}
                      onChange={(e) => setTempNuevaSubcat(e.target.value)}
                      style={{ flex: 1, padding: '10px 14px', border: '1px solid #059669', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tempNuevaSubcat.trim()) {
                          actualizar('subcategoria', tempNuevaSubcat.trim());
                          setModoNuevaSubcat(false);
                          setTempNuevaSubcat('');
                        } else {
                          alert('Por favor ingresa un nombre válido para la subcategoría.');
                        }
                      }}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#059669',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModoNuevaSubcat(false);
                        setTempNuevaSubcat('');
                      }}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
                {form.subcategoria && !modoNuevaSubcat && (
                  <span style={{ fontSize: '11.5px', color: '#059669', marginTop: '4px', display: 'block' }}>
                    Seleccionado: <strong>{form.subcategoria}</strong>
                  </span>
                )}
              </div>

              <div className="form-field">
                <label>Precio Unitario (S/) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="12.50"
                  value={form.precio}
                  onChange={(e) => actualizar('precio', e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>Stock Inicial (Unidades) *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="50"
                  value={form.stock}
                  onChange={(e) => actualizar('stock', e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>Presentación</label>
                <input
                  type="text"
                  placeholder="Ej: Caja 20 tab"
                  value={form.presentacion}
                  onChange={(e) => actualizar('presentacion', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Registro Sanitario</label>
                <input
                  type="text"
                  placeholder="Ej: RS-12345"
                  value={form.registroSanitario}
                  onChange={(e) => actualizar('registroSanitario', e.target.value)}
                />
              </div>

              {/* ZONA DE IMAGEN (2 COLUMNAS) */}
              <div className="form-field full">
                <label>Imagen del producto</label>
                
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  
                  {/* Columna Izquierda: Drag & Drop */}
                  <div style={{ flex: '1 1 300px' }}>
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setDragActivo(true); }}
                      onDragLeave={() => setDragActivo(false)}
                      onDrop={onDrop}
                      style={{
                        border: `2px dashed ${dragActivo ? '#059669' : '#d1d5db'}`,
                        borderRadius: 8,
                        padding: 20,
                        textAlign: 'center',
                        backgroundColor: dragActivo ? '#ecfdf5' : '#f9fafb',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: '140px'
                      }}
                      onClick={() => document.getElementById('input-imagen')?.click()}
                    >
                      <input 
                        id="input-imagen"
                        type="file" 
                        accept="image/jpeg, image/png, image/webp, .jfif"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            subirArchivo(e.target.files[0]);
                          }
                        }}
                      />
                      
                      {subiendoImagen ? (
                        <p style={{ color: '#059669', fontSize: 13, fontWeight: 600 }}>Subiendo imagen…</p>
                      ) : (
                        <div>
                          <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 28, color: '#9ca3af', marginBottom: 10 }}></i>
                          <p style={{ fontSize: 13, color: '#6b7280' }}>
                            Arrastra una imagen aquí o haz clic para buscar en tus documentos
                          </p>
                          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>JPG, PNG, WEBP o JFIF</p>
                        </div>
                      )}
                    </div>
                    {errorImagen && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{errorImagen}</p>}
                  </div>

                  {/* Columna Derecha: Imágenes Disponibles */}
                  <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
                    <div 
                      onClick={() => setGaleriaAbierta(!galeriaAbierta)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        cursor: 'pointer', 
                        marginBottom: galeriaAbierta ? '6px' : '0',
                        userSelect: 'none'
                      }}
                    >
                      <i 
                        className={`fa-solid fa-chevron-${galeriaAbierta ? 'down' : 'right'}`} 
                        style={{ fontSize: '10px', color: '#6b7280' }}
                      ></i>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>
                        Adjuntar Imágenes Disponibles ({imagenesDisponibles.length})
                      </span>
                    </div>

                    {galeriaAbierta && (
                      <div style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        padding: 8,
                        overflowY: 'auto',
                        height: '140px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                        gap: 8,
                        backgroundColor: '#f9fafb'
                      }}>
                        {imagenesDisponibles.length === 0 ? (
                          <p style={{ fontSize: 12, color: '#9ca3af', gridColumn: '1 / -1', textAlign: 'center', marginTop: 20 }}>
                            No hay imágenes guardadas.
                          </p>
                        ) : (
                          imagenesDisponibles.map((url, idx) => (
                            <div 
                              key={idx}
                              onMouseEnter={() => setHoveredImg(url)}
                              onMouseLeave={() => setHoveredImg(null)}
                              onClick={() => actualizar('imagenUrl', url)}
                              style={{
                                cursor: 'pointer',
                                border: form.imagenUrl === url ? '2px solid #059669' : '1px solid #d1d5db',
                                borderRadius: 6,
                                overflow: 'hidden',
                                height: 60,
                                position: 'relative'
                              }}
                              title={url}
                            >
                              <img 
                                src={url} 
                                alt="Disponible" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                              {form.imagenUrl === url && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 150, 105, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="fa-solid fa-check" style={{ color: 'white', fontSize: 20 }}></i>
                                </div>
                              )}
                              
                              {hoveredImg === url && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    eliminarImagen(url);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: 2,
                                    right: 2,
                                    width: 20,
                                    height: 20,
                                    backgroundColor: 'rgba(220, 38, 38, 0.5)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 10,
                                    padding: 0
                                  }}
                                  title="Eliminar imagen"
                                >
                                  <i className="fa-solid fa-xmark" style={{ fontSize: 12 }}></i>
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Input manual */}
                <div style={{ marginTop: '12px' }}>
                  <input
                    type="text"
                    placeholder="Ej: /img/productos/imagen.png"
                    value={form.imagenUrl}
                    onChange={(e) => actualizar('imagenUrl', e.target.value)}
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                  
                  {form.imagenUrl && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 15, marginTop: 12, padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb' }}>
                      <img 
                        src={form.imagenUrl} 
                        alt="Vista previa" 
                        style={{ height: 150, minWidth: 150, borderRadius: 8, objectFit: 'contain', backgroundColor: '#fff', border: '1px solid #d1d5db' }}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        onLoad={(e) => (e.currentTarget.style.display = 'block')}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 10 }}>
                        <span style={{ fontSize: 14, color: '#059669', fontWeight: 700 }}>
                          <i className="fa-solid fa-circle-check"></i> Imagen seleccionada
                        </span>
                        <span style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                          Así se verá la foto en la tienda.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.requiereReceta}
                  onChange={(e) => actualizar('requiereReceta', e.target.checked)}
                />
                Este medicamento requiere receta médica obligatoria (Rx)
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setModalAbierto(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={guardando}>
                  {guardando ? 'Guardando…' : form.id ? 'Actualizar Medicamento' : 'Guardar Medicamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
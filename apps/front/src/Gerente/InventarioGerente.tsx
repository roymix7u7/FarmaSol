import { useEffect, useState } from 'react';
import { catalogoApi } from '../api/catalogo';
import { api, mensajeDeError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Categoria, Producto } from '../types';
import '../Css/InventarioGerente.css';
import '../Css/Dashboard.css';
import { STOCK_BAJO } from './useAlertasPanel';

/** Filas por página: con los 144 productos en una sola tabla había que bajar sin fin. */
const POR_PAGINA = 15;

export type FiltroStock = 'todos' | 'por-agotar' | 'agotados';

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

export function InventarioGerente({
  filtroInicial = 'todos',
  onReportar,
}: {
  filtroInicial?: FiltroStock;
  /** Abre el formulario real de "Reportar un problema" (lo maneja el panel). */
  onReportar?: () => void;
}) {
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
  const [filtroStock, setFiltroStock] = useState<FiltroStock>(filtroInicial);
  const [pagina, setPagina] = useState(1);
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

  const texto = busqueda.trim().toLowerCase();
  const agotados = productos.filter((p) => p.stock === 0).length;
  // Mismo umbral que el Resumen y los Reportes (stock ≤ 10), para que los números coincidan.
  const porAgotar = productos.filter((p) => p.stock > 0 && p.stock <= STOCK_BAJO).length;

  // Busca también por marca y categoría: en mostrador se pregunta "¿qué tienes de Bayer?".
  const filtrados = productos.filter((p) => {
    if (filtroStock === 'agotados' && p.stock !== 0) return false;
    if (filtroStock === 'por-agotar' && !(p.stock > 0 && p.stock <= STOCK_BAJO)) return false;
    if (!texto) return true;
    return [p.nombre, p.marca, p.nombreCategoria, p.subcategoria]
      .some((campo) => campo?.toLowerCase().includes(texto));
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  const estadoStock = (stock: number) => {
    if (stock === 0) return { texto: 'Agotado', clase: 'badge-red' };
    if (stock <= STOCK_BAJO) return { texto: 'Por agotar', clase: 'badge-yellow' };
    return { texto: 'En stock', clase: 'badge-green' };
  };

  return (
    <>
      <div className="kpi-row">
        <button
          type="button"
          className={`kpi kpi-boton ${filtroStock === 'todos' ? 'kpi-principal' : ''}`}
          onClick={() => { setFiltroStock('todos'); setPagina(1); }}
        >
          <span className="kpi-label">Productos en catálogo</span>
          <span className="kpi-valor">{productos.length}</span>
          <span className="kpi-nota">Ver todos</span>
        </button>
        <button
          type="button"
          className={`kpi kpi-boton ${filtroStock === 'por-agotar' ? 'kpi-principal' : ''}`}
          onClick={() => { setFiltroStock('por-agotar'); setPagina(1); }}
        >
          <span className="kpi-label">Por agotar</span>
          <span className="kpi-valor" style={{ color: '#b45309' }}>{porAgotar}</span>
          <span className="kpi-nota">10 unidades o menos</span>
        </button>
        <button
          type="button"
          className={`kpi kpi-boton ${filtroStock === 'agotados' ? 'kpi-principal' : ''}`}
          onClick={() => { setFiltroStock('agotados'); setPagina(1); }}
        >
          <span className="kpi-label">Agotados</span>
          <span className="kpi-valor" style={{ color: '#b91c1c' }}>{agotados}</span>
          <span className="kpi-nota">Sin unidades para vender</span>
        </button>
      </div>

      <div className="table-card">
        <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="buscador-con-icono">
            <i className="fa-solid fa-magnifying-glass" aria-hidden></i>
            <input
              className="search-input"
              placeholder="Buscar por nombre, marca o categoría…"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              aria-label="Buscar productos"
            />
          </div>

          {puedeEditar ? (
            <button className="btn-primary" onClick={abrirCrear}>
              <i className="fa-solid fa-plus"></i> Nuevo producto
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                <i className="fa-solid fa-lock" style={{ marginRight: 6 }}></i>
                Solo lectura
              </span>
              {/* Solo el empleado lo necesita: el gerente es quien administra el catálogo. */}
              <button
                type="button"
                className="btn-chico"
                onClick={onReportar}
              >
                <i className="fa-solid fa-flag" style={{ marginRight: 6 }}></i>
                Reportar un problema
              </button>
            </div>
          )}
        </div>

        {error && <div style={{ padding: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}

        {cargando ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Cargando productos…</div>
        ) : filtrados.length === 0 ? (
          <div className="panel-vacio">Ningún producto coincide con la búsqueda.</div>
        ) : (
          <div className="tabla-scroll">
            <table className="data-table tabla-inventario">
              <colgroup>
                <col style={{ width: '38%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '12%' }} />
                {puedeEditar && <col style={{ width: '13%' }} />}
              </colgroup>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="num">Stock</th>
                  <th className="num">Precio</th>
                  <th>Estado</th>
                  {puedeEditar && <th></th>}
                </tr>
              </thead>
              <tbody>
                {visibles.map((prod) => {
                  const estado = estadoStock(prod.stock);
                  return (
                    <tr key={prod.id}>
                      <td>
                        <div className="celda-producto">
                          <div className="celda-producto-img">
                            {prod.imagenUrl ? (
                              <img src={prod.imagenUrl} alt="" loading="lazy" />
                            ) : (
                              <i className="fa-solid fa-pills" aria-hidden></i>
                            )}
                          </div>
                          <div className="celda-producto-texto">
                            <span className="celda-producto-nombre" title={prod.nombre}>
                              {prod.nombre}
                              {prod.requiereReceta && <span className="mini-rx">Rx</span>}
                            </span>
                            <span className="celda-producto-sub">
                              #{String(prod.id).padStart(3, '0')}
                              {prod.marca && ` · ${prod.marca}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="celda-categoria">{prod.nombreCategoria || 'Sin categoría'}</span>
                        {prod.subcategoria && (
                          <span className="celda-producto-sub">{prod.subcategoria}</span>
                        )}
                      </td>
                      <td className="num">{prod.stock}</td>
                      <td className="num">S/ {prod.precioFinal.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                      </td>
                      {puedeEditar && (
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-chico" onClick={() => abrirEditar(prod)}>
                            Editar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <span>
            {filtrados.length === 0
              ? 'Sin resultados'
              : `${(paginaSegura - 1) * POR_PAGINA + 1}–${Math.min(paginaSegura * POR_PAGINA, filtrados.length)} de ${filtrados.length} productos`}
          </span>
          {totalPaginas > 1 && (
            <div className="pagination">
              <button
                disabled={paginaSegura === 1}
                onClick={() => setPagina(paginaSegura - 1)}
                aria-label="Página anterior"
              >
                ‹
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPaginas || Math.abs(n - paginaSegura) <= 1)
                .map((n, i, arr) => (
                  <span key={n} style={{ display: 'contents' }}>
                    {i > 0 && n - arr[i - 1] > 1 && <span className="pagination-puntos">…</span>}
                    <button
                      className={n === paginaSegura ? 'active' : undefined}
                      onClick={() => setPagina(n)}
                      aria-current={n === paginaSegura ? 'page' : undefined}
                    >
                      {n}
                    </button>
                  </span>
                ))}
              <button
                disabled={paginaSegura === totalPaginas}
                onClick={() => setPagina(paginaSegura + 1)}
                aria-label="Página siguiente"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>


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
                    {Array.from(new Set([
                      "Pañales", 
                      "Toallitas Húmedas", 
                      "Analgésicos", 
                      "Antibióticos", 
                      "Antiinflamatorios", 
                      "Pasta Dental", 
                      ...subcategoriasPersonalizadas,
                      ...(form.subcategoria ? [form.subcategoria] : []) // <--- Solución: Incluye temporalmente la subcategoría nueva en las opciones
                    ])).map((sub) => (
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
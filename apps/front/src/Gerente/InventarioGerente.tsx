import { useEffect, useState } from 'react';
import { catalogoApi } from '../api/catalogo';
import { api, mensajeDeError } from '../api/client';
import type { Categoria, Producto } from '../types';
import '../Css/InventarioGerente.css';

interface ProductoForm {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: string;
  stock: string;
  idCategoria: string;
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
  imagenUrl: '',
  marca: '',
  presentacion: '',
  registroSanitario: '',
  requiereReceta: false,
};

export function InventarioGerente() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState<ProductoForm>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  useEffect(() => {
    cargarDatos();
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

  // Aplanar categorías (raíz + subcategorías) para el dropdown
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
    setErrorForm('');
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
      imagenUrl: p.imagenUrl || '',
      marca: p.marca || '',
      presentacion: p.presentacion || '',
      registroSanitario: p.registroSanitario || '',
      requiereReceta: p.requiereReceta,
    });
    setErrorForm('');
    setModalAbierto(true);
  }

  function actualizar<K extends keyof ProductoForm>(campo: K, valor: ProductoForm[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForm('');

    // Validaciones
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

  return (
    <>
      <div className="table-card">
        <div className="table-toolbar">
          <input
            className="search-input"
            placeholder="Buscar medicamento por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="btn-primary" onClick={abrirCrear}>
            <i className="fa-solid fa-plus"></i> Nuevo Producto
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
                <th>Stock</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
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
                    <td>{prod.stock} und.</td>
                    <td>S/ {prod.precioFinal.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                    </td>
                    <td>
                      <i
                        className="fa-solid fa-pencil action-icon"
                        onClick={() => abrirEditar(prod)}
                      ></i>
                    </td>
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

      {/* ============ MODAL ============ */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={() => !guardando && setModalAbierto(false)}>
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

              <div className="form-field full">
                <label>URL de la imagen</label>
                <input
                  type="text"
                  placeholder="Ej: /img/productos/paracetamol.jpg"
                  value={form.imagenUrl}
                  onChange={(e) => actualizar('imagenUrl', e.target.value)}
                />
                <small style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Las imágenes deben estar en <code>public/img/productos/</code>. Escribe la ruta así:{' '}
                  <code>/img/productos/nombre.jpg</code>
                </small>
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
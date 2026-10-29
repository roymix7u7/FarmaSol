import { useEffect, useMemo, useRef, useState } from 'react';
import { catalogoApi } from '../../api/catalogo';
import { mensajeDeError } from '../../api/client';
import {
  aCentimos,
  MARCAS_TARJETA,
  METODOS_PAGO,
  soles,
  UMBRAL_BOLETA,
  validarUltimos4,
  validarVoucher,
  validarYape,
  ventasApi,
  type MarcaTarjeta,
  type MetodoPago,
  type Venta,
  type VentaRequest,
} from '../../api/ventas';
import {
  infoDocumento,
  limpiarDocumento,
  TIPOS_DOCUMENTO,
  validarDocumento,
  type TipoDocumento,
} from '../../shared/validaciones';
import type { Producto } from '../../types';
import { Ticket } from './Ticket';

interface Linea {
  producto: Producto;
  cantidad: number;
  recetaVerificada: boolean;
}

/**
 * Las tildes, tras normalizar a NFD, son marcas combinantes de U+0300 a U+036F.
 * Se arma con códigos y no con un literal: así no quedan caracteres invisibles
 * en el código fuente.
 */
const DIACRITICOS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');

const MAX_RESULTADOS = 50;
const BILLETES = [10, 20, 50, 100, 200];

/** Para buscar sin que importen tildes ni mayúsculas: "panal" encuentra "Pañal". */
function plano(texto: string) {
  return texto
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .toLowerCase();
}

/** Deja escribir un monto en soles: dígitos y como mucho 2 decimales (acepta coma). */
function limpiarMonto(valor: string) {
  const v = valor.replace(',', '.').replace(/[^0-9.]/g, '');
  const [entero, ...resto] = v.split('.');
  if (resto.length === 0) return entero.slice(0, 5);
  return `${entero.slice(0, 5)}.${resto.join('').slice(0, 2)}`;
}

function soloDigitos(valor: string, max: number) {
  return valor.replace(/[^0-9]/g, '').slice(0, max);
}

/**
 * Billetes que tiene sentido ofrecer como atajo: el monto exacto, la siguiente
 * decena y los billetes que alcanzan para pagar. Sin repetidos, como mucho 5.
 */
function atajosEfectivo(totalC: number) {
  if (totalC <= 0) return [];
  const opciones = new Set<number>([totalC, Math.ceil(totalC / 1000) * 1000]);
  for (const b of BILLETES) if (b * 100 >= totalC) opciones.add(b * 100);
  return [...opciones].sort((a, b) => a - b).slice(0, 5);
}

export function NuevaVenta({ onVentaRegistrada }: { onVentaRegistrada: () => void }) {
  const [catalogo, setCatalogo] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [resaltado, setResaltado] = useState(0);
  const [lineas, setLineas] = useState<Linea[]>([]);

  const [metodo, setMetodo] = useState<MetodoPago>('EFECTIVO');
  const [recibido, setRecibido] = useState('');
  const [codigoYape, setCodigoYape] = useState('');
  const [marca, setMarca] = useState<MarcaTarjeta | ''>('');
  const [ultimos4, setUltimos4] = useState('');
  const [voucher, setVoucher] = useState('');

  const [identificar, setIdentificar] = useState(false);
  const [compTipo, setCompTipo] = useState<TipoDocumento>('DNI');
  const [compDoc, setCompDoc] = useState('');
  const [compNombre, setCompNombre] = useState('');

  // Los errores de los campos se muestran después del primer intento de cobro,
  // o cuando el campo ya tiene algo: avisar sobre un campo vacío que el cajero
  // ni siquiera ha tocado solo estorba.
  const [intentado, setIntentado] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [ventaHecha, setVentaHecha] = useState<Venta | null>(null);

  const buscadorRef = useRef<HTMLInputElement>(null);

  function cargarCatalogo() {
    return catalogoApi
      .productos()
      .then((ps) => setCatalogo([...ps].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))))
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar el catálogo')))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    void cargarCatalogo();
    buscadorRef.current?.focus();
  }, []);

  // ------------------------------------------------------------ búsqueda

  const resultados = useMemo(() => {
    const q = plano(busqueda.trim());
    const lista = q
      ? catalogo.filter((p) =>
          plano(`${p.nombre} ${p.marca ?? ''} ${p.nombreCategoria} ${p.presentacion ?? ''}`).includes(q),
        )
      : catalogo;
    return lista.slice(0, MAX_RESULTADOS);
  }, [busqueda, catalogo]);

  /** Cuánto de un producto ya está en la venta: el stock disponible es lo que queda. */
  function enVenta(idProducto: number) {
    return lineas.find((l) => l.producto.id === idProducto)?.cantidad ?? 0;
  }

  function agregar(p: Producto) {
    if (enVenta(p.id) >= p.stock) {
      setError(`No hay más stock de '${p.nombre}': quedan ${p.stock}.`);
      return;
    }
    setError('');
    setLineas((ls) => {
      const existe = ls.find((l) => l.producto.id === p.id);
      return existe
        ? ls.map((l) => (l.producto.id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l))
        : [...ls, { producto: p, cantidad: 1, recetaVerificada: false }];
    });
    setBusqueda('');
    setResaltado(0);
    buscadorRef.current?.focus();
  }

  function onTeclaBuscador(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setResaltado((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setResaltado((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const p = resultados[resaltado];
      if (p && p.stock > 0) agregar(p);
    } else if (e.key === 'Escape') {
      setBusqueda('');
      setResaltado(0);
    }
  }

  function cambiarCantidad(idProducto: number, valor: number) {
    setLineas((ls) =>
      ls.map((l) =>
        l.producto.id === idProducto
          ? { ...l, cantidad: Math.max(1, Math.min(valor || 1, l.producto.stock, 999)) }
          : l,
      ),
    );
  }

  function quitar(idProducto: number) {
    setLineas((ls) => ls.filter((l) => l.producto.id !== idProducto));
  }

  function marcarReceta(idProducto: number, valor: boolean) {
    setLineas((ls) => ls.map((l) => (l.producto.id === idProducto ? { ...l, recetaVerificada: valor } : l)));
  }

  // ------------------------------------------------------------ totales

  // Todo en céntimos enteros: el total que ve el cajero debe ser al céntimo el
  // mismo que calculará el servidor.
  const subtotalC = lineas.reduce((t, l) => t + aCentimos(l.producto.precio) * l.cantidad, 0);
  const descuentoC = lineas.reduce((t, l) => t + aCentimos(l.producto.descuentoUnitario) * l.cantidad, 0);
  const totalC = subtotalC - descuentoC;
  const unidades = lineas.reduce((t, l) => t + l.cantidad, 0);
  const exigeComprador = totalC > UMBRAL_BOLETA * 100;
  const pideComprador = identificar || exigeComprador;

  const recibidoC = recibido ? aCentimos(Number(recibido)) : null;
  const vueltoC = recibidoC !== null ? recibidoC - totalC : null;

  // ------------------------------------------------------------ validación

  const errores = {
    recibido:
      metodo !== 'EFECTIVO'
        ? null
        : recibidoC === null || recibidoC <= 0
          ? 'Indica cuánto entregó el cliente'
          : recibidoC < totalC
            ? `Falta ${soles((totalC - recibidoC) / 100)}`
            : null,
    yape: metodo === 'YAPE' ? validarYape(codigoYape) : null,
    marca: metodo === 'TARJETA' && !marca ? 'Elige la marca de la tarjeta' : null,
    ultimos4: metodo === 'TARJETA' ? validarUltimos4(ultimos4) : null,
    voucher: metodo === 'TARJETA' ? validarVoucher(voucher) : null,
    compDoc: pideComprador ? validarDocumento(compTipo, compDoc) : null,
    compNombre: pideComprador && compNombre.trim().length < 3 ? 'Escribe el nombre completo' : null,
  };

  const recetasPendientes = lineas.filter((l) => l.producto.requiereReceta && !l.recetaVerificada);

  /** Lo que falta para poder cobrar, en palabras: un botón gris sin motivo no ayuda. */
  const pendientes: string[] = [];
  if (lineas.length === 0) pendientes.push('Agrega al menos un producto');
  if (recetasPendientes.length > 0) {
    pendientes.push(
      `Confirma la receta física de: ${recetasPendientes.map((l) => l.producto.nombre).join(', ')}`,
    );
  }
  if (lineas.length > 0) {
    if (errores.recibido) pendientes.push(errores.recibido === 'Indica cuánto entregó el cliente' ? errores.recibido : `El efectivo no alcanza: ${errores.recibido.toLowerCase()}`);
    if (errores.yape) pendientes.push('Falta el número de operación de Yape');
    if (errores.marca || errores.ultimos4 || errores.voucher) pendientes.push('Completa los datos del voucher');
    if (errores.compDoc || errores.compNombre) {
      pendientes.push(exigeComprador ? `Ventas de más de ${soles(UMBRAL_BOLETA)}: identifica al comprador` : 'Completa los datos del comprador');
    }
  }
  const puedeCobrar = pendientes.length === 0 && !procesando;

  function verError(campo: keyof typeof errores, valor: string) {
    return errores[campo] && (intentado || valor) ? errores[campo] : null;
  }

  // ------------------------------------------------------------ cobro

  function limpiarVenta() {
    setLineas([]);
    setRecibido('');
    setCodigoYape('');
    setMarca('');
    setUltimos4('');
    setVoucher('');
    setIdentificar(false);
    setCompDoc('');
    setCompNombre('');
    setIntentado(false);
    setError('');
  }

  async function cobrar() {
    setIntentado(true);
    if (!puedeCobrar) return;

    const venta: VentaRequest = {
      items: lineas.map((l) => ({
        idProducto: l.producto.id,
        cantidad: l.cantidad,
        recetaVerificada: l.recetaVerificada,
      })),
      metodoPago: metodo,
    };
    if (metodo === 'EFECTIVO') venta.montoRecibido = Number(recibido);
    if (metodo === 'YAPE') venta.codigoOperacion = codigoYape;
    if (metodo === 'TARJETA') {
      venta.tarjetaMarca = marca as MarcaTarjeta;
      venta.tarjetaUltimos4 = ultimos4;
      venta.codigoOperacion = voucher;
    }
    if (pideComprador) {
      venta.cliente = { tipoDocumento: compTipo, documento: compDoc, nombre: compNombre.trim() };
    }

    setProcesando(true);
    setError('');
    try {
      const hecha = await ventasApi.registrar(venta);
      setVentaHecha(hecha);
      limpiarVenta();
      onVentaRegistrada();
    } catch (err) {
      // La venta en pantalla se conserva: si falló, el cajero corrige y reintenta.
      setError(mensajeDeError(err, 'No se pudo registrar la venta'));
    } finally {
      setProcesando(false);
      // Stock y precios frescos: otro cajero pudo vender, o cambiar una promoción.
      void cargarCatalogo();
    }
  }

  function nuevaVenta() {
    setVentaHecha(null);
    setTimeout(() => buscadorRef.current?.focus(), 0);
  }

  // ------------------------------------------------------------ vista

  const doc = infoDocumento(compTipo);

  return (
    <>
      <div className="pv-layout">
        {/* -------- Catálogo -------- */}
        <section className="pv-panel">
          <div className="pv-panel-cab">
            <h2 className="pv-panel-titulo">Buscar productos</h2>
            <span style={{ fontSize: 12.5, color: 'var(--texto-suave)' }}>
              {catalogo.length} en catálogo
            </span>
          </div>
          <div className="pv-panel-cuerpo">
            <div className="pv-buscador">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
              <input
                ref={buscadorRef}
                id="pv-buscar"
                type="search"
                placeholder="Nombre, marca o categoría…"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setResaltado(0);
                }}
                onKeyDown={onTeclaBuscador}
                autoComplete="off"
                aria-label="Buscar productos"
              />
            </div>
            <p className="pv-ayuda-teclado">
              <kbd>↑</kbd> <kbd>↓</kbd> para moverte · <kbd>Enter</kbd> agrega el resaltado ·{' '}
              <kbd>Esc</kbd> limpia
            </p>

            {cargando ? (
              <p className="pv-vacio">Cargando catálogo…</p>
            ) : resultados.length === 0 ? (
              <p className="pv-vacio">Ningún producto coincide con «{busqueda}».</p>
            ) : (
              <div className="pv-resultados">
                {resultados.map((p, i) => {
                  const disponible = p.stock - enVenta(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`pv-resultado${i === resaltado ? ' resaltado' : ''}`}
                      disabled={disponible <= 0}
                      onClick={() => agregar(p)}
                      onMouseEnter={() => setResaltado(i)}
                    >
                      <div>
                        <div className="pv-resultado-nombre">
                          {p.nombre}
                          {p.requiereReceta && <span className="pv-badge-rx">Rx</span>}
                        </div>
                        <div className="pv-resultado-meta">
                          {[p.marca, p.presentacion].filter(Boolean).join(' · ') || p.nombreCategoria}
                        </div>
                      </div>
                      <span
                        className="pv-stock"
                        style={{
                          color: disponible <= 0 ? '#dc2626' : disponible < 10 ? '#d97706' : 'var(--texto-suave)',
                        }}
                      >
                        {disponible <= 0 ? 'Sin stock' : `${disponible} disp.`}
                      </span>
                      <span className="pv-resultado-precio">
                        <b>{soles(p.precioFinal)}</b>
                        {p.descuentoUnitario > 0 && <s>{soles(p.precio)}</s>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* -------- Venta actual y cobro -------- */}
        <section className="pv-panel">
          <div className="pv-panel-cab">
            <h2 className="pv-panel-titulo">
              Venta actual
              {unidades > 0 && (
                <span style={{ fontWeight: 500, color: 'var(--texto-suave)', fontSize: 13 }}>
                  {' '}
                  · {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
                </span>
              )}
            </h2>
            {lineas.length > 0 && (
              <button type="button" className="pv-limpiar" onClick={limpiarVenta}>
                Vaciar
              </button>
            )}
          </div>

          <div className="pv-panel-cuerpo">
            {error && (
              <div className="panel-aviso" role="alert" style={{ marginBottom: 12 }}>
                {error}
              </div>
            )}

            {lineas.length === 0 ? (
              <p className="pv-vacio">
                Busca un producto y pulsa <b>Enter</b> o haz clic para agregarlo.
              </p>
            ) : (
              <>
                {lineas.map((l) => {
                  const p = l.producto;
                  return (
                    <div key={p.id} className="pv-linea">
                      <div>
                        <div className="pv-linea-nombre">
                          {p.nombre}
                          {p.requiereReceta && <span className="pv-badge-rx">Rx</span>}
                        </div>
                        <div className="pv-linea-unit">
                          {soles(p.precioFinal)} c/u
                          {p.descuentoUnitario > 0 && (
                            <span style={{ color: 'var(--verde)' }}> · promo</span>
                          )}
                        </div>
                      </div>
                      <div className="pv-cantidad">
                        <button
                          type="button"
                          aria-label={`Quitar una unidad de ${p.nombre}`}
                          disabled={l.cantidad <= 1}
                          onClick={() => cambiarCantidad(p.id, l.cantidad - 1)}
                        >
                          −
                        </button>
                        <input
                          aria-label={`Cantidad de ${p.nombre}`}
                          inputMode="numeric"
                          value={l.cantidad}
                          onChange={(e) => cambiarCantidad(p.id, Number(soloDigitos(e.target.value, 3)))}
                        />
                        <button
                          type="button"
                          aria-label={`Agregar una unidad de ${p.nombre}`}
                          disabled={l.cantidad >= p.stock}
                          onClick={() => cambiarCantidad(p.id, l.cantidad + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="pv-linea-total">
                        {soles((aCentimos(p.precioFinal) * l.cantidad) / 100)}
                      </span>
                      <button
                        type="button"
                        className="pv-quitar"
                        aria-label={`Quitar ${p.nombre} de la venta`}
                        onClick={() => quitar(p.id)}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>

                      {p.requiereReceta && (
                        <label className={`pv-receta${l.recetaVerificada ? ' verificada' : ''}`}>
                          <input
                            type="checkbox"
                            checked={l.recetaVerificada}
                            onChange={(e) => marcarReceta(p.id, e.target.checked)}
                          />
                          Revisé la receta médica física y está vigente
                        </label>
                      )}
                    </div>
                  );
                })}

                <div className="pv-totales">
                  <div className="pv-total-fila">
                    <span>Subtotal</span>
                    <span>{soles(subtotalC / 100)}</span>
                  </div>
                  {descuentoC > 0 && (
                    <div className="pv-total-fila descuento">
                      <span>Descuentos por promoción</span>
                      <span>−{soles(descuentoC / 100)}</span>
                    </div>
                  )}
                  <div className="pv-total-final">
                    <span>Total</span>
                    <b>{soles(totalC / 100)}</b>
                  </div>
                </div>
              </>
            )}
          </div>

          {lineas.length > 0 && (
            <>
              {/* -------- Comprador -------- */}
              <div className="pv-seccion">
                <h3 className="pv-seccion-titulo">
                  Comprador
                  {exigeComprador ? (
                    <span className="pv-obligatorio">Obligatorio: más de {soles(UMBRAL_BOLETA)}</span>
                  ) : (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'none', letterSpacing: 0, fontWeight: 600, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={identificar}
                        onChange={(e) => setIdentificar(e.target.checked)}
                        style={{ accentColor: 'var(--verde)' }}
                      />
                      Identificar en la boleta
                    </label>
                  )}
                </h3>

                {pideComprador ? (
                  <div className="pv-campos">
                    <div className="pv-campo">
                      <label htmlFor="pv-comp-tipo">Documento</label>
                      <select
                        id="pv-comp-tipo"
                        value={compTipo}
                        onChange={(e) => {
                          const t = e.target.value as TipoDocumento;
                          setCompTipo(t);
                          setCompDoc((d) => limpiarDocumento(t, d));
                        }}
                      >
                        {TIPOS_DOCUMENTO.map((t) => (
                          <option key={t.valor} value={t.valor}>
                            {t.etiqueta}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={`pv-campo${verError('compDoc', compDoc) ? ' con-error' : ''}`}>
                      <label htmlFor="pv-comp-doc">Número</label>
                      <input
                        id="pv-comp-doc"
                        inputMode={doc.soloNumeros ? 'numeric' : 'text'}
                        maxLength={doc.largoMax}
                        value={compDoc}
                        onChange={(e) => setCompDoc(limpiarDocumento(compTipo, e.target.value))}
                        placeholder={doc.ayuda}
                      />
                      {verError('compDoc', compDoc) && (
                        <span className="pv-campo-error">{verError('compDoc', compDoc)}</span>
                      )}
                    </div>
                    <div className={`pv-campo ancho${verError('compNombre', compNombre) ? ' con-error' : ''}`}>
                      <label htmlFor="pv-comp-nombre">Nombres y apellidos</label>
                      <input
                        id="pv-comp-nombre"
                        maxLength={120}
                        value={compNombre}
                        onChange={(e) => setCompNombre(e.target.value)}
                      />
                      {verError('compNombre', compNombre) && (
                        <span className="pv-campo-error">{verError('compNombre', compNombre)}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="pv-campo-ayuda" style={{ margin: 0 }}>
                    Opcional en boletas de hasta {soles(UMBRAL_BOLETA)}. Márcalo si el cliente lo pide.
                  </p>
                )}
              </div>

              {/* -------- Pago -------- */}
              <div className="pv-seccion">
                <h3 className="pv-seccion-titulo">Método de pago</h3>
                <div className="pv-metodos" role="radiogroup" aria-label="Método de pago">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m.valor}
                      type="button"
                      role="radio"
                      aria-checked={metodo === m.valor}
                      className={`pv-metodo${metodo === m.valor ? ' activo' : ''}`}
                      onClick={() => setMetodo(m.valor)}
                    >
                      <i className={`fa-solid ${m.icono}`} aria-hidden="true"></i>
                      {m.etiqueta}
                    </button>
                  ))}
                </div>

                {metodo === 'EFECTIVO' && (
                  <>
                    <div className="pv-campos">
                      <div className={`pv-campo ancho${verError('recibido', recibido) && recibidoC !== null && recibidoC <= 0 ? ' con-error' : ''}`}>
                        <label htmlFor="pv-recibido">Monto recibido (S/)</label>
                        <input
                          id="pv-recibido"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={recibido}
                          onChange={(e) => setRecibido(limpiarMonto(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="pv-billetes">
                      {atajosEfectivo(totalC).map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="pv-billete"
                          onClick={() => setRecibido((c / 100).toFixed(2))}
                        >
                          {c === totalC ? 'Exacto' : soles(c / 100)}
                        </button>
                      ))}
                    </div>
                    {vueltoC !== null && recibidoC !== null && recibidoC > 0 && (
                      <div className={`pv-vuelto ${vueltoC >= 0 ? 'ok' : 'falta'}`} aria-live="polite">
                        <span>{vueltoC >= 0 ? 'Vuelto' : 'Falta'}</span>
                        <b>{soles(Math.abs(vueltoC) / 100)}</b>
                      </div>
                    )}
                  </>
                )}

                {metodo === 'YAPE' && (
                  <div className="pv-campos">
                    <div className={`pv-campo ancho${verError('yape', codigoYape) ? ' con-error' : ''}`}>
                      <label htmlFor="pv-yape">N° de operación de Yape</label>
                      <input
                        id="pv-yape"
                        inputMode="numeric"
                        maxLength={12}
                        placeholder="Ej.: 12345678"
                        value={codigoYape}
                        onChange={(e) => setCodigoYape(soloDigitos(e.target.value, 12))}
                      />
                      {verError('yape', codigoYape) ? (
                        <span className="pv-campo-error">{verError('yape', codigoYape)}</span>
                      ) : (
                        <span className="pv-campo-ayuda">
                          Está en la constancia que muestra el cliente. Cobra recién cuando veas el
                          pago confirmado.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {metodo === 'TARJETA' && (
                  <>
                    <div className="pv-campos">
                      <div className={`pv-campo${verError('marca', marca) ? ' con-error' : ''}`}>
                        <label htmlFor="pv-marca">Marca</label>
                        <select
                          id="pv-marca"
                          value={marca}
                          onChange={(e) => setMarca(e.target.value as MarcaTarjeta | '')}
                        >
                          <option value="">Elegir…</option>
                          {MARCAS_TARJETA.map((m) => (
                            <option key={m.valor} value={m.valor}>
                              {m.etiqueta}
                            </option>
                          ))}
                        </select>
                        {verError('marca', marca) && (
                          <span className="pv-campo-error">{verError('marca', marca)}</span>
                        )}
                      </div>
                      <div className={`pv-campo${verError('ultimos4', ultimos4) ? ' con-error' : ''}`}>
                        <label htmlFor="pv-ultimos4">Últimos 4 dígitos</label>
                        <input
                          id="pv-ultimos4"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="1234"
                          value={ultimos4}
                          onChange={(e) => setUltimos4(soloDigitos(e.target.value, 4))}
                        />
                        {verError('ultimos4', ultimos4) && (
                          <span className="pv-campo-error">{verError('ultimos4', ultimos4)}</span>
                        )}
                      </div>
                      <div className={`pv-campo ancho${verError('voucher', voucher) ? ' con-error' : ''}`}>
                        <label htmlFor="pv-voucher">N° de operación del voucher</label>
                        <input
                          id="pv-voucher"
                          inputMode="numeric"
                          maxLength={12}
                          placeholder="Impreso en el voucher del POS"
                          value={voucher}
                          onChange={(e) => setVoucher(soloDigitos(e.target.value, 12))}
                        />
                        {verError('voucher', voucher) && (
                          <span className="pv-campo-error">{verError('voucher', voucher)}</span>
                        )}
                      </div>
                    </div>
                    <p className="pv-aviso-pci">
                      <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
                      <span>
                        Nunca escribas el número completo de la tarjeta. El cobro se hace en el POS;
                        aquí solo se registra el voucher.
                      </span>
                    </p>
                  </>
                )}
              </div>

              {/* -------- Cobrar -------- */}
              <div className="pv-seccion">
                <button
                  type="button"
                  className="pv-cobrar"
                  disabled={!puedeCobrar}
                  onClick={cobrar}
                >
                  {procesando ? (
                    'Registrando…'
                  ) : (
                    <>
                      <i className="fa-solid fa-cash-register" aria-hidden="true"></i>
                      Cobrar {soles(totalC / 100)}
                    </>
                  )}
                </button>
                {pendientes.length > 0 && (
                  <ul className="pv-pendientes" aria-live="polite">
                    {pendientes.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {ventaHecha && (
        <div className="modal-overlay" onClick={nuevaVenta}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  <i className="fa-solid fa-circle-check" style={{ color: 'var(--verde)', marginRight: 8 }}></i>
                  Venta registrada
                </h2>
                <p className="modal-subtitle">
                  {ventaHecha.codigoVenta}
                  {ventaHecha.metodoPago === 'EFECTIVO' && ventaHecha.vuelto > 0 &&
                    ` · Entregar vuelto: ${soles(ventaHecha.vuelto)}`}
                </p>
              </div>
              <button className="modal-close" onClick={nuevaVenta} aria-label="Cerrar">
                ×
              </button>
            </div>

            <Ticket venta={ventaHecha} />

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => window.print()}>
                <i className="fa-solid fa-print"></i> Imprimir
              </button>
              <button className="btn-save" onClick={nuevaVenta} autoFocus>
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

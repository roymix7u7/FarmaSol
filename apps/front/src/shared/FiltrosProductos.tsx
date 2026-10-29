import { useEffect, useMemo, useState } from 'react';
import type { Producto } from '../types';
import '../Css/Filtros.css';

export interface EstadoFiltros {
  precioMin: number;
  precioMax: number;
  ventaLibre: boolean;
  conReceta: boolean;
  marcas: string[];
  categorias: string[];
}

interface Props {
  /** Lista completa, sin filtrar. De aquí salen las marcas y el rango de precios. */
  productos: Producto[];
  /** Se llama con la lista ya filtrada cada vez que cambia algún filtro. */
  onFiltrar: (filtrados: Producto[]) => void;
  /** El filtro por categoría solo tiene sentido fuera de una página de categoría. */
  mostrarCategorias?: boolean;
}

/** Redondea hacia abajo/arriba a la decena, para que el slider tenga topes limpios. */
function pisoDecena(n: number) {
  return Math.floor(n / 10) * 10;
}
function techoDecena(n: number) {
  return Math.ceil(n / 10) * 10;
}

export function FiltrosProductos({ productos, onFiltrar, mostrarCategorias = false }: Props) {
  // Los topes del slider se derivan del catálogo real, no son fijos.
  const [limiteMin, limiteMax] = useMemo(() => {
    if (productos.length === 0) return [0, 100];
    const precios = productos.map((p) => p.precioFinal);
    const min = pisoDecena(Math.min(...precios));
    const max = techoDecena(Math.max(...precios));
    // Si todos cuestan lo mismo, damos margen para que el slider sea usable.
    return min === max ? [min, max + 10] : [min, max];
  }, [productos]);

  const marcasDisponibles = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const p of productos) {
      if (p.marca) conteo.set(p.marca, (conteo.get(p.marca) ?? 0) + 1);
    }
    return [...conteo.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [productos]);

  const categoriasDisponibles = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const p of productos) {
      if (p.nombreCategoria) conteo.set(p.nombreCategoria, (conteo.get(p.nombreCategoria) ?? 0) + 1);
    }
    return [...conteo.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [productos]);

  const [precioMin, setPrecioMin] = useState(limiteMin);
  const [precioMax, setPrecioMax] = useState(limiteMax);
  const [ventaLibre, setVentaLibre] = useState(false);
  const [conReceta, setConReceta] = useState(false);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [buscarMarca, setBuscarMarca] = useState('');
  const [abiertoEnMovil, setAbiertoEnMovil] = useState(false);

  // Al cambiar de categoría o de búsqueda llega otro catálogo: el rango se reajusta.
  useEffect(() => {
    setPrecioMin(limiteMin);
    setPrecioMax(limiteMax);
    setMarcas([]);
    setCategorias([]);
  }, [limiteMin, limiteMax]);

  const filtrados = useMemo(() => {
    return productos.filter((p) => {
      if (p.precioFinal < precioMin || p.precioFinal > precioMax) return false;
      // Marcar las dos condiciones de venta equivale a no filtrar por ellas.
      if (ventaLibre !== conReceta) {
        if (ventaLibre && p.requiereReceta) return false;
        if (conReceta && !p.requiereReceta) return false;
      }
      if (marcas.length > 0 && (!p.marca || !marcas.includes(p.marca))) return false;
      if (categorias.length > 0 && !categorias.includes(p.nombreCategoria)) return false;
      return true;
    });
  }, [productos, precioMin, precioMax, ventaLibre, conReceta, marcas, categorias]);

  useEffect(() => {
    onFiltrar(filtrados);
    // onFiltrar se omite a propósito: si el padre la redefine en cada render,
    // incluirla haría que este efecto se dispare en bucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrados]);

  const hayFiltros =
    precioMin !== limiteMin ||
    precioMax !== limiteMax ||
    ventaLibre ||
    conReceta ||
    marcas.length > 0 ||
    categorias.length > 0;

  function limpiar() {
    setPrecioMin(limiteMin);
    setPrecioMax(limiteMax);
    setVentaLibre(false);
    setConReceta(false);
    setMarcas([]);
    setCategorias([]);
    setBuscarMarca('');
  }

  function alternar(lista: string[], set: (v: string[]) => void, valor: string) {
    set(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  const marcasVisibles = marcasDisponibles.filter(([nombre]) =>
    nombre.toLowerCase().includes(buscarMarca.trim().toLowerCase()),
  );

  return (
    <div>
      <button
        type="button"
        className="filtros-toggle"
        onClick={() => setAbiertoEnMovil((v) => !v)}
        aria-expanded={abiertoEnMovil}
      >
        {abiertoEnMovil ? 'Ocultar filtros' : 'Mostrar filtros'}
        {hayFiltros && ` (${filtrados.length} de ${productos.length})`}
      </button>

      {/* El plegado es puramente CSS: leer window.innerWidth aqui no reaccionaria
          al redimensionar la ventana. */}
      <aside className={`filtros${abiertoEnMovil ? '' : ' esta-plegado'}`}>
        <div className="filtros-cabecera">
          <h2 className="filtros-titulo">Filtros</h2>
          <button type="button" className="filtros-limpiar" onClick={limpiar} disabled={!hayFiltros}>
            Limpiar
          </button>
        </div>
        <p className="filtros-rango-etiqueta">
          {filtrados.length} de {productos.length} productos
        </p>

        {mostrarCategorias && categoriasDisponibles.length > 1 && (
          <div className="filtros-grupo">
            <h3 className="filtros-grupo-titulo">Categorías</h3>
            {categoriasDisponibles.map(([nombre, cuantos]) => (
              <label key={nombre} className="filtros-opcion" title={nombre}>
                <input
                  type="checkbox"
                  checked={categorias.includes(nombre)}
                  onChange={() => alternar(categorias, setCategorias, nombre)}
                />
                <span>{nombre}</span>
                <span className="filtros-conteo">{cuantos}</span>
              </label>
            ))}
          </div>
        )}

        <div className="filtros-grupo">
          <h3 className="filtros-grupo-titulo">Condición de venta</h3>
          <label className="filtros-opcion">
            <input
              type="checkbox"
              checked={ventaLibre}
              onChange={() => setVentaLibre((v) => !v)}
            />
            <span>Venta libre (OTC)</span>
          </label>
          <label className="filtros-opcion">
            <input type="checkbox" checked={conReceta} onChange={() => setConReceta((v) => !v)} />
            <span>Con receta médica (Rx)</span>
          </label>
        </div>

        <div className="filtros-grupo filtros-rango">
          <h3 className="filtros-grupo-titulo">Rango de precio</h3>
          <div className="filtros-rango-valores">
            <span>S/ {precioMin.toFixed(2)}</span>
            <span>S/ {precioMax.toFixed(2)}</span>
          </div>
          <span className="filtros-rango-etiqueta">Desde</span>
          <input
            type="range"
            min={limiteMin}
            max={limiteMax}
            step={1}
            value={precioMin}
            aria-label="Precio mínimo"
            // Los topes no se cruzan: el mínimo empuja al máximo y viceversa.
            onChange={(e) => setPrecioMin(Math.min(Number(e.target.value), precioMax))}
          />
          <span className="filtros-rango-etiqueta">Hasta</span>
          <input
            type="range"
            min={limiteMin}
            max={limiteMax}
            step={1}
            value={precioMax}
            aria-label="Precio máximo"
            onChange={(e) => setPrecioMax(Math.max(Number(e.target.value), precioMin))}
          />
        </div>

        {marcasDisponibles.length > 0 && (
          <div className="filtros-grupo">
            <h3 className="filtros-grupo-titulo">Marcas</h3>
            {marcasDisponibles.length > 6 && (
              <input
                type="text"
                className="filtros-buscar-marca"
                placeholder="Buscar marca…"
                value={buscarMarca}
                onChange={(e) => setBuscarMarca(e.target.value)}
              />
            )}
            <div className="filtros-lista-scroll">
              {marcasVisibles.length === 0 ? (
                <p className="filtros-vacio">Ninguna marca coincide.</p>
              ) : (
                marcasVisibles.map(([nombre, cuantos]) => (
                  <label key={nombre} className="filtros-opcion" title={nombre}>
                    <input
                      type="checkbox"
                      checked={marcas.includes(nombre)}
                      onChange={() => alternar(marcas, setMarcas, nombre)}
                    />
                    <span>{nombre}</span>
                    <span className="filtros-conteo">{cuantos}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.producto.PrecioCalculadoDTO;
import com.farmasol.backend.model.Categoria;
import com.farmasol.backend.model.Producto;
import com.farmasol.backend.model.Promocion;
import com.farmasol.backend.model.enums.TipoDescuento;
import com.farmasol.backend.repository.CategoriaRepository;
import com.farmasol.backend.repository.PromocionRepository;
import com.farmasol.backend.service.PrecioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PrecioServiceImpl implements PrecioService {

    private final PromocionRepository promocionRepository;
    private final CategoriaRepository categoriaRepository;

    @Override
    @Transactional(readOnly = true)
    public PrecioCalculadoDTO calcular(Producto producto) {
        return calcular(List.of(producto)).get(producto.getId());
    }

    /**
     * Resuelve los precios de toda la lista con 3 consultas fijas: las promociones
     * vigentes (con sus productos y con sus categorías) y el árbol de categorías.
     * No crece con la cantidad de productos.
     */
    @Override
    @Transactional(readOnly = true)
    public Map<Long, PrecioCalculadoDTO> calcular(Collection<Producto> productos) {
        Map<Long, PrecioCalculadoDTO> resultado = new LinkedHashMap<>();
        if (productos.isEmpty()) {
            return resultado;
        }

        LocalDate hoy = LocalDate.now();
        // Las dos consultas devuelven las mismas promociones; la segunda solo
        // completa la colección de categorías sobre las instancias ya cargadas.
        List<Promocion> vigentes = promocionRepository.findVigentesConProductos(hoy);
        promocionRepository.findVigentesConCategorias(hoy);

        Map<Long, Long> padrePorCategoria = cargarArbolCategorias();

        for (Producto producto : productos) {
            Set<Long> categorias = ancestrosDe(producto.getCategoria().getId(), padrePorCategoria);
            resultado.put(producto.getId(), mejorPrecio(producto, vigentes, categorias));
        }
        return resultado;
    }

    /** Mapa hijo -> padre de todas las categorías, en una sola consulta. */
    private Map<Long, Long> cargarArbolCategorias() {
        Map<Long, Long> padres = new HashMap<>();
        for (Object[] fila : categoriaRepository.findIdYPadre()) {
            padres.put((Long) fila[0], (Long) fila[1]);
        }
        return padres;
    }

    /** La categoría más todos sus ancestros, subiendo por el árbol ya cargado. */
    private Set<Long> ancestrosDe(Long idCategoria, Map<Long, Long> padrePorCategoria) {
        Set<Long> ids = new HashSet<>();
        Long actual = idCategoria;
        // La condición de `add` corta el recorrido si el árbol tuviera un ciclo.
        while (actual != null && ids.add(actual)) {
            actual = padrePorCategoria.get(actual);
        }
        return ids;
    }

    /** La promoción vigente que más descuento deja para este producto. */
    private PrecioCalculadoDTO mejorPrecio(Producto producto, List<Promocion> vigentes, Set<Long> categorias) {
        BigDecimal precioBase = producto.getPrecio();
        BigDecimal mejorDescuento = BigDecimal.ZERO;
        Long idPromo = null;

        for (Promocion promo : vigentes) {
            if (!aplicaA(promo, producto.getId(), categorias)) {
                continue;
            }
            BigDecimal descuento = descuentoDe(promo, precioBase);
            if (descuento.compareTo(mejorDescuento) > 0) {
                mejorDescuento = descuento;
                idPromo = promo.getId();
            }
        }

        BigDecimal precioFinal = precioBase.subtract(mejorDescuento).max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        return PrecioCalculadoDTO.builder()
                .precioBase(precioBase)
                .descuentoUnitario(mejorDescuento.setScale(2, RoundingMode.HALF_UP))
                .precioFinal(precioFinal)
                .idPromocionAplicada(idPromo)
                .build();
    }

    /** Una promoción aplica por asignación directa al producto o por alguna de sus categorías. */
    private boolean aplicaA(Promocion promo, Long idProducto, Set<Long> categorias) {
        for (Producto p : promo.getProductos()) {
            if (p.getId().equals(idProducto)) {
                return true;
            }
        }
        for (Categoria c : promo.getCategorias()) {
            if (categorias.contains(c.getId())) {
                return true;
            }
        }
        return false;
    }

    private BigDecimal descuentoDe(Promocion promo, BigDecimal precioBase) {
        if (promo.getTipoDescuento() == TipoDescuento.PORCENTAJE) {
            return precioBase.multiply(promo.getValorDescuento())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        return promo.getValorDescuento().min(precioBase);
    }
}

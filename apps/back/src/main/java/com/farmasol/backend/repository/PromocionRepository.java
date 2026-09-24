package com.farmasol.backend.repository;

import com.farmasol.backend.model.Promocion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface PromocionRepository extends JpaRepository<Promocion, Long> {

    List<Promocion> findByActivoTrueAndMostrarEnCarruselTrueOrderByOrden();

    /**
     * Promociones vigentes hoy que aplican a un producto, ya sea por asignación directa
     * o por alguna de sus categorías (la del producto o sus ancestros).
     */
    @Query("""
            SELECT DISTINCT pr FROM Promocion pr
            LEFT JOIN pr.productos prod
            LEFT JOIN pr.categorias cat
            WHERE pr.activo = true
              AND :hoy BETWEEN pr.fechaInicio AND pr.fechaFin
              AND (prod.id = :idProducto OR cat.id IN :idsCategorias)
            """)
    List<Promocion> findPromocionesVigentesParaProducto(@Param("idProducto") Long idProducto,
                                                        @Param("idsCategorias") Collection<Long> idsCategorias,
                                                        @Param("hoy") LocalDate hoy);

    /**
     * Todas las promociones vigentes hoy, con sus productos ya cargados.
     *
     * <p>Se usa para calcular precios de una lista completa: en vez de preguntar
     * "¿qué promociones aplican a este producto?" una vez por producto, se traen
     * todas las vigentes de golpe y el cruce se hace en memoria.
     */
    @Query("""
            SELECT DISTINCT pr FROM Promocion pr
            LEFT JOIN FETCH pr.productos
            WHERE pr.activo = true
              AND :hoy BETWEEN pr.fechaInicio AND pr.fechaFin
            """)
    List<Promocion> findVigentesConProductos(@Param("hoy") LocalDate hoy);

    /**
     * Las mismas promociones vigentes, con sus categorías cargadas.
     *
     * <p>Va en una consulta aparte a propósito: traer las dos colecciones en un
     * solo JOIN FETCH produce un producto cartesiano. Como ambas consultas corren
     * en la misma transacción, Hibernate completa las mismas instancias.
     */
    @Query("""
            SELECT DISTINCT pr FROM Promocion pr
            LEFT JOIN FETCH pr.categorias
            WHERE pr.activo = true
              AND :hoy BETWEEN pr.fechaInicio AND pr.fechaFin
            """)
    List<Promocion> findVigentesConCategorias(@Param("hoy") LocalDate hoy);
}

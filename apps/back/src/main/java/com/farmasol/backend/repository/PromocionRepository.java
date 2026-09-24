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
}

package com.farmasol.backend.repository;

import com.farmasol.backend.model.Venta;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VentaRepository extends JpaRepository<Venta, Long> {

    @EntityGraph(attributePaths = {"detalles", "vendidoPor", "anuladaPor"})
    Optional<Venta> findWithDetallesById(Long id);

    /** Ventas de un rango, de la más reciente a la más antigua. */
    @EntityGraph(attributePaths = {"detalles", "vendidoPor", "anuladaPor"})
    @Query("""
            SELECT DISTINCT v FROM Venta v
            WHERE v.fechaVenta BETWEEN :desde AND :hasta
            ORDER BY v.fechaVenta DESC
            """)
    List<Venta> listarEntre(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    /** Igual, pero solo las de un vendedor: el empleado ve su propia caja. */
    @EntityGraph(attributePaths = {"detalles", "vendidoPor", "anuladaPor"})
    @Query("""
            SELECT DISTINCT v FROM Venta v
            WHERE v.fechaVenta BETWEEN :desde AND :hasta
              AND v.vendidoPor.id = :idVendedor
            ORDER BY v.fechaVenta DESC
            """)
    List<Venta> listarEntreDeVendedor(@Param("desde") LocalDateTime desde,
                                      @Param("hasta") LocalDateTime hasta,
                                      @Param("idVendedor") Long idVendedor);

    // --- Reportes. Las anuladas no cuentan como venta en ninguno.

    @Query("""
            SELECT FUNCTION('DATE', v.fechaVenta) AS dia, COUNT(v), COALESCE(SUM(v.total), 0)
            FROM Venta v
            WHERE v.anulada = false
              AND v.fechaVenta BETWEEN :desde AND :hasta
            GROUP BY FUNCTION('DATE', v.fechaVenta)
            ORDER BY dia
            """)
    List<Object[]> reporteVentasPorDia(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Query("""
            SELECT d.producto.id, d.nombreProducto, SUM(d.cantidad), SUM(d.subtotal)
            FROM VentaDetalle d
            WHERE d.venta.anulada = false
              AND d.venta.fechaVenta BETWEEN :desde AND :hasta
            GROUP BY d.producto.id, d.nombreProducto
            """)
    List<Object[]> reporteProductosVendidos(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}

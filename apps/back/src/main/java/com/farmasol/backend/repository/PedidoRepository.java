package com.farmasol.backend.repository;

import com.farmasol.backend.model.Pedido;
import com.farmasol.backend.model.enums.EstadoPedido;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByCliente_IdOrderByFechaPedidoDesc(Long idCliente);

    @EntityGraph(attributePaths = {"detalles", "detalles.producto", "cliente", "direccion", "atendidoPor"})
    Optional<Pedido> findWithDetallesById(Long id);

    Optional<Pedido> findByIdAndCliente_Id(Long id, Long idCliente);

    List<Pedido> findByEstadoOrderByFechaPedidoDesc(EstadoPedido estado);

    List<Pedido> findAllByOrderByFechaPedidoDesc();

    // --- Reportes ---

    @Query("""
            SELECT FUNCTION('DATE', p.fechaPedido) AS dia, COUNT(p) AS cantidad, COALESCE(SUM(p.total), 0) AS monto
            FROM Pedido p
            WHERE p.estado <> com.farmasol.backend.model.enums.EstadoPedido.CANCELADO
              AND p.fechaPedido BETWEEN :desde AND :hasta
            GROUP BY FUNCTION('DATE', p.fechaPedido)
            ORDER BY dia
            """)
    List<Object[]> reporteVentasPorDia(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Query("""
            SELECT d.producto.id, d.nombreProducto, SUM(d.cantidad), SUM(d.subtotal)
            FROM PedidoDetalle d
            WHERE d.pedido.estado <> com.farmasol.backend.model.enums.EstadoPedido.CANCELADO
              AND d.pedido.fechaPedido BETWEEN :desde AND :hasta
            GROUP BY d.producto.id, d.nombreProducto
            ORDER BY SUM(d.cantidad) DESC
            """)
    List<Object[]> reporteProductosMasVendidos(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Query("""
            SELECT p.estado, COUNT(p), COALESCE(SUM(p.total), 0)
            FROM Pedido p
            WHERE p.fechaPedido BETWEEN :desde AND :hasta
            GROUP BY p.estado
            """)
    List<Object[]> reportePedidosPorEstado(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}

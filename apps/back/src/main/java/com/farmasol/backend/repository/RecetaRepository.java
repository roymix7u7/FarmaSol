package com.farmasol.backend.repository;

import com.farmasol.backend.model.Receta;
import com.farmasol.backend.model.enums.EstadoReceta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecetaRepository extends JpaRepository<Receta, Long> {

    List<Receta> findByPedidoDetalle_IdOrderByFechaSubidaDesc(Long idPedidoDetalle);

    Optional<Receta> findFirstByPedidoDetalle_IdOrderByFechaSubidaDesc(Long idPedidoDetalle);

    List<Receta> findByPedidoDetalle_Pedido_IdOrderByFechaSubidaDesc(Long idPedido);

    List<Receta> findByEstadoOrderByFechaSubidaAsc(EstadoReceta estado);
}

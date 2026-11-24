package com.farmasol.backend.repository;

import com.farmasol.backend.model.Carrito;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CarritoRepository extends JpaRepository<Carrito, Long> {

    @EntityGraph(attributePaths = {"detalles", "detalles.producto", "detalles.producto.categoria"})
    Optional<Carrito> findByCliente_Id(Long idCliente);
}

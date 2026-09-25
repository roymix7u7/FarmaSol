package com.farmasol.backend.repository;

import com.farmasol.backend.model.Producto;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    // La categoría se trae en la misma consulta (@EntityGraph). Sin esto, al leer
    // producto.getCategoria() en el mapeo a DTO, Hibernate lanza una consulta por
    // cada producto: el clásico N+1.

    @EntityGraph(attributePaths = "categoria")
    List<Producto> findByActivoTrue();

    @EntityGraph(attributePaths = "categoria")
    List<Producto> findByNombreContainingIgnoreCaseAndActivoTrue(String nombre);

    @EntityGraph(attributePaths = "categoria")
    List<Producto> findByCategoria_IdInAndActivoTrue(Collection<Long> idsCategoria);

    @EntityGraph(attributePaths = "categoria")
    List<Producto> findByStockLessThanEqualAndActivoTrue(Integer umbral);

    @Override
    @EntityGraph(attributePaths = "categoria")
    List<Producto> findAll();

    boolean existsByCategoria_IdAndActivoTrue(Long idCategoria);
}

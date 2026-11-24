package com.farmasol.backend.repository;

import com.farmasol.backend.model.Producto;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

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

    // Para el catálogo de ejemplo (DataSeeder): saber qué productos ya están.
    boolean existsByNombre(String nombre);

    Optional<Producto> findFirstByNombre(String nombre);

    /**
     * Productos bloqueados para escritura hasta que termine la transacción.
     *
     * <p>Lo usa la venta presencial: sin bloqueo, dos cajeros vendiendo la última
     * unidad a la vez leerían ambos stock 1 y lo dejarían en -1. El orden por id
     * hace que dos ventas simultáneas pidan los bloqueos en el mismo orden, para
     * que nunca se queden esperándose la una a la otra (deadlock).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Producto p WHERE p.id IN :ids ORDER BY p.id")
    List<Producto> findAllByIdInParaVenta(@Param("ids") Collection<Long> ids);
}

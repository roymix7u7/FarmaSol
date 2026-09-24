package com.farmasol.backend.repository;

import com.farmasol.backend.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByActivoTrue();

    List<Producto> findByNombreContainingIgnoreCaseAndActivoTrue(String nombre);

    List<Producto> findByCategoria_IdInAndActivoTrue(Collection<Long> idsCategoria);

    List<Producto> findByStockLessThanEqualAndActivoTrue(Integer umbral);

    boolean existsByCategoria_IdAndActivoTrue(Long idCategoria);
}

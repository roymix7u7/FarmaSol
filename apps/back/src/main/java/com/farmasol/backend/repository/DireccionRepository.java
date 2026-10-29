package com.farmasol.backend.repository;

import com.farmasol.backend.model.Direccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DireccionRepository extends JpaRepository<Direccion, Long> {

    List<Direccion> findByCliente_IdAndActivoTrue(Long idCliente);

    Optional<Direccion> findByIdAndCliente_Id(Long id, Long idCliente);

    List<Direccion> findByCliente_IdAndEsPredeterminadaTrue(Long idCliente);
}

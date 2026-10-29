package com.farmasol.backend.repository;

import com.farmasol.backend.model.Sede;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SedeRepository extends JpaRepository<Sede, Long> {

    List<Sede> findByActivoTrue();
}

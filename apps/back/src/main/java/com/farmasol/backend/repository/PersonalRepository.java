package com.farmasol.backend.repository;

import com.farmasol.backend.model.Personal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PersonalRepository extends JpaRepository<Personal, Long> {

    Optional<Personal> findByUsuario(String usuario);

    Optional<Personal> findByUsuarioAndActivoTrue(String usuario);

    Optional<Personal> findByCorreo(String correo);

    boolean existsByUsuario(String usuario);

    boolean existsByCorreo(String correo);

    List<Personal> findByActivoTrue();
}

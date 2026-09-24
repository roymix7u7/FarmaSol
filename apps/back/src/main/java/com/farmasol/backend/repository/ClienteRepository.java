package com.farmasol.backend.repository;

import com.farmasol.backend.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByUsuario(String usuario);

    Optional<Cliente> findByUsuarioAndActivoTrue(String usuario);

    Optional<Cliente> findByCorreo(String correo);

    boolean existsByUsuario(String usuario);

    boolean existsByCorreo(String correo);

    boolean existsByDni(String dni);
}

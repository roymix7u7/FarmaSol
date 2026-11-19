package com.farmasol.backend.repository;

import com.farmasol.backend.model.Incidencia;
import com.farmasol.backend.model.enums.EstadoIncidencia;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidenciaRepository extends JpaRepository<Incidencia, Long> {

    // Trae a quién reportó y quién resolvió en la misma consulta: sin esto, la
    // lista hacía una consulta extra por cada fila.
    @EntityGraph(attributePaths = {"reportadoPor", "resueltoPor"})
    List<Incidencia> findAllByOrderByFechaReporteDesc();

    @EntityGraph(attributePaths = {"reportadoPor", "resueltoPor"})
    List<Incidencia> findByEstadoOrderByFechaReporteDesc(EstadoIncidencia estado);

    @EntityGraph(attributePaths = {"reportadoPor", "resueltoPor"})
    List<Incidencia> findByReportadoPorIdOrderByFechaReporteDesc(Long idPersonal);
}

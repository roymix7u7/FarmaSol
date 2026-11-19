package com.farmasol.backend.model;

import com.farmasol.backend.model.enums.EstadoIncidencia;
import com.farmasol.backend.model.enums.TipoIncidencia;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Un problema que un trabajador le reporta al gerente desde el panel: una
 * diferencia de stock en el anaquel, un producto dañado, un error de caja...
 * El gerente lo marca como resuelto y puede dejarle una respuesta.
 */
@Entity
@Table(name = "incidencias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_incidencia")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoIncidencia tipo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean urgente = false;

    /** Pedido, producto o código relacionado, si lo hay. */
    @Column(length = 120)
    private String referencia;

    @Column(nullable = false, length = 500)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoIncidencia estado = EstadoIncidencia.PENDIENTE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reportado_por", nullable = false)
    private Personal reportadoPor;

    @Column(name = "fecha_reporte", nullable = false)
    private LocalDateTime fechaReporte;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resuelto_por")
    private Personal resueltoPor;

    @Column(length = 500)
    private String respuesta;

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;

    @PrePersist
    void alCrear() {
        if (fechaReporte == null) fechaReporte = LocalDateTime.now();
    }
}

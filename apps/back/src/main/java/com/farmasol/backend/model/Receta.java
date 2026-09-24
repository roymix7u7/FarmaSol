package com.farmasol.backend.model;

import com.farmasol.backend.model.enums.EstadoReceta;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Foto/PDF de receta médica subida por el cliente para una línea de pedido
 * (producto con {@code requiere_receta = true}). El cliente puede volver a
 * subir otra si la anterior fue rechazada: cada intento es una fila nueva.
 */
@Entity
@Table(name = "recetas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Receta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_receta")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pedido_detalle", nullable = false)
    private PedidoDetalle pedidoDetalle;

    /** Ruta relativa dentro de farmasol.uploads.dir, ej. "recetas/&lt;uuid&gt;.jpg". */
    @Column(name = "archivo_ruta", nullable = false, length = 255)
    private String archivoRuta;

    @Column(name = "tipo_contenido", nullable = false, length = 100)
    private String tipoContenido;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoReceta estado = EstadoReceta.PENDIENTE_REVISION;

    @Column(name = "motivo_rechazo", length = 255)
    private String motivoRechazo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revisado_por")
    private Personal revisadoPor;

    @Column(name = "fecha_subida", nullable = false, updatable = false)
    private LocalDateTime fechaSubida;

    @Column(name = "fecha_revision")
    private LocalDateTime fechaRevision;

    @PrePersist
    protected void onCreate() {
        this.fechaSubida = LocalDateTime.now();
    }
}

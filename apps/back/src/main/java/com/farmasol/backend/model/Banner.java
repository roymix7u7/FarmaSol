package com.farmasol.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Banner promocional del carrusel de la página principal. Es independiente de las
 * promociones: un banner solo anuncia (texto, imagen y a dónde lleva el botón),
 * no cambia ningún precio.
 */
@Entity
@Table(name = "banners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_banner")
    private Long id;

    @Column(nullable = false, length = 80)
    private String titulo;

    @Column(length = 200)
    private String subtitulo;

    @Column(name = "texto_boton", length = 30)
    private String textoBoton;

    /** Ruta interna de la tienda (/categoria/farmacia) o una URL completa. */
    @Column(length = 255)
    private String enlace;

    @Column(name = "imagen_url", length = 255)
    private String imagenUrl;

    /** Color de fondo en hexadecimal (#2ea471). */
    @Column(name = "color_fondo", length = 7)
    private String colorFondo;

    /** Opcionales: sin fechas, el banner se muestra mientras esté activo. */
    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column
    @Builder.Default
    private Integer orden = 0;

    @Column
    @Builder.Default
    private Boolean activo = true;

    /** Activo y, si tiene fechas, dentro de ese rango. */
    public boolean esVigente(LocalDate hoy) {
        if (!Boolean.TRUE.equals(activo)) return false;
        if (fechaInicio != null && hoy.isBefore(fechaInicio)) return false;
        return fechaFin == null || !hoy.isAfter(fechaFin);
    }
}

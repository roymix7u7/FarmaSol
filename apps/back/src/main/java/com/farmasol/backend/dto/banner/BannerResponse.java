package com.farmasol.backend.dto.banner;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerResponse {

    private Long id;
    private String titulo;
    private String subtitulo;
    private String textoBoton;
    private String enlace;
    private String imagenUrl;
    private String colorFondo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Integer orden;
    private Boolean activo;
    /** Activo y dentro de sus fechas: es lo que decide si sale en la tienda hoy. */
    private Boolean vigente;
}

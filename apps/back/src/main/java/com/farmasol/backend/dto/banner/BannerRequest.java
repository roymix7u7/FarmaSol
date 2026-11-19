package com.farmasol.backend.dto.banner;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BannerRequest {

    @NotBlank(message = "El título es obligatorio")
    @Size(min = 3, max = 80, message = "El título debe tener entre 3 y 80 caracteres")
    private String titulo;

    @Size(max = 200, message = "El subtítulo no puede pasar de 200 caracteres")
    private String subtitulo;

    @Size(max = 30, message = "El texto del botón no puede pasar de 30 caracteres")
    private String textoBoton;

    @Size(max = 255, message = "El enlace es demasiado largo")
    @Pattern(regexp = "^$|^/.*|^https?://.+", message = "El enlace debe empezar con / o con http(s)://")
    private String enlace;

    @Size(max = 255, message = "La ruta de la imagen es demasiado larga")
    private String imagenUrl;

    @Pattern(regexp = "^$|^#[0-9a-fA-F]{6}$", message = "El color debe tener el formato #RRGGBB")
    private String colorFondo;

    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    @Min(value = 0, message = "El orden no puede ser negativo")
    private Integer orden;

    private Boolean activo;

    @AssertTrue(message = "La fecha de fin no puede ser anterior a la de inicio")
    public boolean isRangoValido() {
        return fechaInicio == null || fechaFin == null || !fechaFin.isBefore(fechaInicio);
    }
}

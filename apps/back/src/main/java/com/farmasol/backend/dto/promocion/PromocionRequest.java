package com.farmasol.backend.dto.promocion;

import com.farmasol.backend.model.enums.TipoDescuento;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromocionRequest {

    @NotBlank(message = "El título es obligatorio")
    private String titulo;

    private String descripcion;

    @NotNull(message = "El tipo de descuento es obligatorio")
    private TipoDescuento tipoDescuento;

    @NotNull(message = "El valor del descuento es obligatorio")
    @Positive(message = "El valor del descuento debe ser mayor a 0")
    private BigDecimal valorDescuento;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    @NotNull(message = "La fecha de fin es obligatoria")
    private LocalDate fechaFin;

    private String imagenBanner;

    private Boolean mostrarEnCarrusel;

    private Integer orden;

    private Set<Long> idsProductos;

    private Set<Long> idsCategorias;

    @AssertTrue(message = "La fecha de fin no puede ser anterior a la de inicio")
    public boolean isRangoFechasValido() {
        return fechaInicio == null || fechaFin == null || !fechaFin.isBefore(fechaInicio);
    }

    @AssertTrue(message = "El descuento porcentual no puede superar 100")
    public boolean isPorcentajeValido() {
        return tipoDescuento != TipoDescuento.PORCENTAJE || valorDescuento == null
                || valorDescuento.compareTo(BigDecimal.valueOf(100)) <= 0;
    }
}

package com.farmasol.backend.dto.promocion;

import com.farmasol.backend.model.enums.TipoDescuento;
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
public class PromocionResponse {

    private Long id;
    private String titulo;
    private String descripcion;
    private TipoDescuento tipoDescuento;
    private BigDecimal valorDescuento;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String imagenBanner;
    private Boolean mostrarEnCarrusel;
    private Integer orden;
    private Boolean activo;
    private boolean vigente;
    private Set<Long> idsProductos;
    private Set<Long> idsCategorias;
}

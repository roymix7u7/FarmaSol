package com.farmasol.backend.dto.promocion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromocionBannerResponse {

    private Long id;
    private String titulo;
    private String descripcion;
    private String imagenBanner;
    private Integer orden;
}

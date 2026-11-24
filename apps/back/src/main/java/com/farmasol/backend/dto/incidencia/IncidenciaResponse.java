package com.farmasol.backend.dto.incidencia;

import com.farmasol.backend.model.enums.EstadoIncidencia;
import com.farmasol.backend.model.enums.TipoIncidencia;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidenciaResponse {

    private Long id;
    private TipoIncidencia tipo;
    private Boolean urgente;
    private String referencia;
    private String descripcion;
    private EstadoIncidencia estado;
    private String reportadoPor;
    private LocalDateTime fechaReporte;
    private String resueltoPor;
    private String respuesta;
    private LocalDateTime fechaResolucion;
}

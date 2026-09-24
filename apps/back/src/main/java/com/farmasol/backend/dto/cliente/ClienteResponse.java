package com.farmasol.backend.dto.cliente;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClienteResponse {

    private Long id;
    private String nombres;
    private String apellidos;
    private String usuario;
    private String correo;
    private String dni;
    private String telefono;
    private Boolean activo;
    private LocalDateTime fechaRegistro;
}

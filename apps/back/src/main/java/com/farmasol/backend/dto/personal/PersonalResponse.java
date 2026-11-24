package com.farmasol.backend.dto.personal;

import com.farmasol.backend.model.enums.RolPersonal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonalResponse {

    private Long id;
    private String nombres;
    private String apellidos;
    private String usuario;
    private String correo;
    private RolPersonal rol;
    private Boolean activo;
    private String creadoPorUsuario;
    private LocalDateTime fechaCreacion;
}

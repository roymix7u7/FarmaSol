package com.farmasol.backend.dto.personal;

import com.farmasol.backend.model.enums.RolPersonal;
import com.farmasol.backend.validation.Reglas;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonalRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombres;

    @NotBlank(message = "El apellido es obligatorio")
    private String apellidos;

    @NotBlank(message = "El usuario es obligatorio")
    @Size(min = 3, max = 50)
    private String usuario;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no tiene un formato válido")
    private String correo;

    /**
     * Obligatorio al crear; opcional al actualizar (si viene, cambia la contraseña).
     * Un valor nulo pasa @Pattern, que es justo lo que permite editar sin cambiarla.
     */
    @Pattern(regexp = Reglas.PASSWORD, message = Reglas.PASSWORD_MENSAJE)
    private String password;

    @NotNull(message = "El rol es obligatorio")
    private RolPersonal rol;
}

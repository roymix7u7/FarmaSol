package com.farmasol.backend.dto.auth;

import com.farmasol.backend.validation.Reglas;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Recuperar contraseña del cliente. Además del correo se pide el documento con
 * el que se registró: con solo el correo, cualquiera que lo conociera podía
 * cambiarle la contraseña a otra persona y entrar a su cuenta.
 */
@Data
public class CambiarPasswordRequest {
    @NotBlank(message = "El correo es obligatorio")
    private String correo;

    @NotBlank(message = "El número de documento es obligatorio")
    private String dni;

    @NotBlank(message = "La contraseña es obligatoria")
    @Pattern(regexp = Reglas.PASSWORD, message = Reglas.PASSWORD_MENSAJE)
    private String nuevaPassword;
}

package com.farmasol.backend.dto.auth;

import com.farmasol.backend.model.enums.TipoDocumento;
import com.farmasol.backend.validation.DocumentoValido;
import com.farmasol.backend.validation.Reglas;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Registro de cliente. No pide "usuario": el cliente inicia sesión con su correo.
 */
@DocumentoValido
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClienteRegisterRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombres;

    @NotBlank(message = "El apellido es obligatorio")
    private String apellidos;

    /** Opcional por compatibilidad: si no llega, se asume DNI. */
    private TipoDocumento tipoDocumento;

    /** El formato depende del tipo de documento: lo revisa @DocumentoValido. */
    @NotBlank(message = "El número de documento es obligatorio")
    private String dni;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no tiene un formato válido")
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    @Pattern(regexp = Reglas.PASSWORD, message = Reglas.PASSWORD_MENSAJE)
    private String password;

    @NotBlank(message = "El teléfono es obligatorio")
    @Pattern(regexp = Reglas.TELEFONO, message = Reglas.TELEFONO_MENSAJE)
    private String telefono;
}

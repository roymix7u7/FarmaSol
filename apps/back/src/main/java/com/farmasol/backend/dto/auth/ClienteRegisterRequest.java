package com.farmasol.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Registro de cliente. No pide "usuario": el cliente inicia sesión con su correo.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClienteRegisterRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombres;

    @NotBlank(message = "El apellido es obligatorio")
    private String apellidos;

    @NotBlank(message = "El DNI / Cédula es obligatorio")
    @Size(min = 6, max = 20, message = "El DNI / Cédula debe tener entre 6 y 20 caracteres")
    private String dni;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no tiene un formato válido")
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, max = 100, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    private String telefono;
}

package com.farmasol.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CambiarPasswordRequest {
    @NotBlank
    private String correo;
    
    @NotBlank
    private String nuevaPassword;
}
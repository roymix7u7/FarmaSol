package com.farmasol.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CambiarPasswordPersonalRequest {
    @NotBlank
    private String usuario;
    
    @NotBlank
    private String nuevaPassword;
}
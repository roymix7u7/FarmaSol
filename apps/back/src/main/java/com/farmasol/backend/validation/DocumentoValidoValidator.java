package com.farmasol.backend.validation;

import com.farmasol.backend.dto.auth.ClienteRegisterRequest;
import com.farmasol.backend.model.enums.TipoDocumento;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class DocumentoValidoValidator implements ConstraintValidator<DocumentoValido, ClienteRegisterRequest> {

    @Override
    public boolean isValid(ClienteRegisterRequest req, ConstraintValidatorContext context) {
        // Que falte el número ya lo reporta @NotBlank; aquí solo se mira el formato.
        if (req == null || req.getDni() == null || req.getDni().isBlank()) {
            return true;
        }
        TipoDocumento tipo = req.getTipoDocumento() == null ? TipoDocumento.DNI : req.getTipoDocumento();
        if (tipo.esValido(req.getDni())) {
            return true;
        }
        // El error se cuelga del campo "dni" para que el formulario lo muestre
        // junto al número, y no como un error genérico del objeto.
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(tipo.getMensajeError())
                .addPropertyNode("dni")
                .addConstraintViolation();
        return false;
    }
}

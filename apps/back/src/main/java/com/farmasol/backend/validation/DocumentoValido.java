package com.farmasol.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Valida que el número de documento cumpla el formato de su tipo. Va sobre la
 * clase y no sobre el campo porque la regla depende de dos campos a la vez.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = DocumentoValidoValidator.class)
public @interface DocumentoValido {

    String message() default "Documento de identidad inválido";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}

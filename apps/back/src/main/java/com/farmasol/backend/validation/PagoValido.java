package com.farmasol.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Valida el formato de los datos de pago según el método elegido, y los del
 * comprador si se llenaron. Va sobre la clase porque qué campos son obligatorios
 * depende del método de pago.
 *
 * <p>Lo que depende del total (que el efectivo alcance, o que el comprador sea
 * obligatorio por encima de S/ 700) lo revisa el servicio, porque el total lo
 * calcula el servidor y aquí todavía no se conoce.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PagoValidoValidator.class)
public @interface PagoValido {

    String message() default "Datos de pago inválidos";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}

package com.farmasol.backend.validation;

import com.farmasol.backend.dto.venta.VentaRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.math.BigDecimal;
import java.util.regex.Pattern;

public class PagoValidoValidator implements ConstraintValidator<PagoValido, VentaRequest> {

    private static final Pattern YAPE = Pattern.compile(Reglas.YAPE_OPERACION);
    private static final Pattern VOUCHER = Pattern.compile(Reglas.VOUCHER);
    private static final Pattern ULTIMOS4 = Pattern.compile(Reglas.ULTIMOS4);

    @Override
    public boolean isValid(VentaRequest req, ConstraintValidatorContext ctx) {
        // Sin método de pago ya responde @NotNull; aquí no hay nada más que mirar.
        if (req == null || req.getMetodoPago() == null) {
            return true;
        }
        ctx.disableDefaultConstraintViolation();
        boolean ok = true;

        switch (req.getMetodoPago()) {
            case EFECTIVO -> {
                if (req.getMontoRecibido() == null || req.getMontoRecibido().compareTo(BigDecimal.ZERO) <= 0) {
                    ok = error(ctx, "montoRecibido", "Indica cuánto entregó el cliente");
                }
            }
            case YAPE -> {
                if (!coincide(YAPE, req.getCodigoOperacion())) {
                    ok = error(ctx, "codigoOperacion", Reglas.YAPE_OPERACION_MENSAJE);
                }
            }
            case TARJETA -> {
                if (req.getTarjetaMarca() == null) {
                    ok = error(ctx, "tarjetaMarca", "Elige la marca de la tarjeta");
                }
                if (!coincide(ULTIMOS4, req.getTarjetaUltimos4())) {
                    ok = error(ctx, "tarjetaUltimos4", Reglas.ULTIMOS4_MENSAJE);
                }
                if (!coincide(VOUCHER, req.getCodigoOperacion())) {
                    ok = error(ctx, "codigoOperacion", Reglas.VOUCHER_MENSAJE);
                }
            }
        }

        VentaRequest.Comprador c = req.getCliente();
        if (c != null && seLlenoAlgo(c)) {
            // Si se empieza a identificar al comprador, tiene que quedar completo:
            // una boleta con documento pero sin nombre no sirve.
            if (c.getTipoDocumento() == null) {
                ok = error(ctx, "cliente.tipoDocumento", "Elige el tipo de documento del comprador");
            } else if (!c.getTipoDocumento().esValido(c.getDocumento())) {
                ok = error(ctx, "cliente.documento", c.getTipoDocumento().getMensajeError());
            }
            if (c.getNombre() == null || c.getNombre().strip().length() < 3) {
                ok = error(ctx, "cliente.nombre", "Escribe el nombre completo del comprador");
            }
        }
        return ok;
    }

    private static boolean seLlenoAlgo(VentaRequest.Comprador c) {
        return c.getTipoDocumento() != null
                || (c.getDocumento() != null && !c.getDocumento().isBlank())
                || (c.getNombre() != null && !c.getNombre().isBlank());
    }

    private static boolean coincide(Pattern p, String valor) {
        return valor != null && p.matcher(valor.strip()).matches();
    }

    /** Cuelga el error del campo, para que el formulario lo muestre junto a él. */
    private static boolean error(ConstraintValidatorContext ctx, String campo, String mensaje) {
        var builder = ctx.buildConstraintViolationWithTemplate(mensaje);
        String[] partes = campo.split("[.]");
        var nodo = builder.addPropertyNode(partes[0]);
        for (int i = 1; i < partes.length; i++) {
            nodo = nodo.addPropertyNode(partes[i]);
        }
        nodo.addConstraintViolation();
        return false;
    }
}

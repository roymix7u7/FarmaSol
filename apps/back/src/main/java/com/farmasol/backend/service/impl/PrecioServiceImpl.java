package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.producto.PrecioCalculadoDTO;
import com.farmasol.backend.model.Producto;
import com.farmasol.backend.model.Promocion;
import com.farmasol.backend.model.enums.TipoDescuento;
import com.farmasol.backend.repository.PromocionRepository;
import com.farmasol.backend.service.CategoriaService;
import com.farmasol.backend.service.PrecioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrecioServiceImpl implements PrecioService {

    private final PromocionRepository promocionRepository;
    private final CategoriaService categoriaService;

    @Override
    @Transactional(readOnly = true)
    public PrecioCalculadoDTO calcular(Producto producto) {
        BigDecimal precioBase = producto.getPrecio();
        List<Long> idsCat = categoriaService.idsAncestros(producto.getCategoria().getId());
        List<Promocion> promos = promocionRepository.findPromocionesVigentesParaProducto(
                producto.getId(), idsCat, LocalDate.now());

        BigDecimal mejorDescuento = BigDecimal.ZERO;
        Long idPromo = null;
        for (Promocion promo : promos) {
            BigDecimal descuento = descuentoDe(promo, precioBase);
            if (descuento.compareTo(mejorDescuento) > 0) {
                mejorDescuento = descuento;
                idPromo = promo.getId();
            }
        }

        BigDecimal precioFinal = precioBase.subtract(mejorDescuento).max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        return PrecioCalculadoDTO.builder()
                .precioBase(precioBase)
                .descuentoUnitario(mejorDescuento.setScale(2, RoundingMode.HALF_UP))
                .precioFinal(precioFinal)
                .idPromocionAplicada(idPromo)
                .build();
    }

    private BigDecimal descuentoDe(Promocion promo, BigDecimal precioBase) {
        if (promo.getTipoDescuento() == TipoDescuento.PORCENTAJE) {
            return precioBase.multiply(promo.getValorDescuento())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        return promo.getValorDescuento().min(precioBase);
    }
}

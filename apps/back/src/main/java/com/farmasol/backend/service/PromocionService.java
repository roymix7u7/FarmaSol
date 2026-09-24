package com.farmasol.backend.service;

import com.farmasol.backend.dto.promocion.PromocionBannerResponse;
import com.farmasol.backend.dto.promocion.PromocionRequest;
import com.farmasol.backend.dto.promocion.PromocionResponse;

import java.util.List;

public interface PromocionService {

    List<PromocionResponse> listar();

    PromocionResponse obtenerPorId(Long id);

    List<PromocionBannerResponse> listarCarrusel();

    PromocionResponse crear(PromocionRequest request);

    PromocionResponse actualizar(Long id, PromocionRequest request);

    void desactivar(Long id);
}

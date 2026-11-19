package com.farmasol.backend.service;

import com.farmasol.backend.dto.banner.BannerRequest;
import com.farmasol.backend.dto.banner.BannerResponse;

import java.util.List;

public interface BannerService {

    /** Los que se ven hoy en la tienda, en orden. */
    List<BannerResponse> listarVigentes();

    /** Todos, para el panel. */
    List<BannerResponse> listar();

    BannerResponse crear(BannerRequest request);

    BannerResponse actualizar(Long id, BannerRequest request);

    BannerResponse cambiarActivo(Long id, boolean activo);

    void eliminar(Long id);
}

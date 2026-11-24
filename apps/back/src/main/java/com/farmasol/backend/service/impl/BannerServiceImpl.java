package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.banner.BannerRequest;
import com.farmasol.backend.dto.banner.BannerResponse;
import com.farmasol.backend.exception.ResourceNotFoundException;
import com.farmasol.backend.model.Banner;
import com.farmasol.backend.repository.BannerRepository;
import com.farmasol.backend.service.BannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BannerServiceImpl implements BannerService {

    private static final String COLOR_POR_DEFECTO = "#2ea471";

    private final BannerRepository bannerRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BannerResponse> listarVigentes() {
        LocalDate hoy = LocalDate.now();
        return bannerRepository.findByActivoTrueOrderByOrdenAscIdAsc().stream()
                .filter(b -> b.esVigente(hoy))
                .map(b -> toResponse(b, hoy))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BannerResponse> listar() {
        LocalDate hoy = LocalDate.now();
        return bannerRepository.findAllByOrderByOrdenAscIdAsc().stream()
                .map(b -> toResponse(b, hoy))
                .toList();
    }

    @Override
    @Transactional
    public BannerResponse crear(BannerRequest request) {
        Banner banner = new Banner();
        aplicar(banner, request);
        return toResponse(bannerRepository.save(banner), LocalDate.now());
    }

    @Override
    @Transactional
    public BannerResponse actualizar(Long id, BannerRequest request) {
        Banner banner = buscar(id);
        aplicar(banner, request);
        return toResponse(bannerRepository.save(banner), LocalDate.now());
    }

    @Override
    @Transactional
    public BannerResponse cambiarActivo(Long id, boolean activo) {
        Banner banner = buscar(id);
        banner.setActivo(activo);
        return toResponse(bannerRepository.save(banner), LocalDate.now());
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        bannerRepository.delete(buscar(id));
    }

    private Banner buscar(Long id) {
        return bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el banner " + id));
    }

    private void aplicar(Banner banner, BannerRequest r) {
        banner.setTitulo(r.getTitulo().trim());
        banner.setSubtitulo(vacioANull(r.getSubtitulo()));
        banner.setTextoBoton(vacioANull(r.getTextoBoton()));
        banner.setEnlace(vacioANull(r.getEnlace()));
        banner.setImagenUrl(vacioANull(r.getImagenUrl()));
        String color = vacioANull(r.getColorFondo());
        banner.setColorFondo(color != null ? color.toLowerCase() : COLOR_POR_DEFECTO);
        banner.setFechaInicio(r.getFechaInicio());
        banner.setFechaFin(r.getFechaFin());
        banner.setOrden(r.getOrden() != null ? r.getOrden() : 0);
        banner.setActivo(r.getActivo() == null || r.getActivo());
    }

    private static String vacioANull(String valor) {
        if (valor == null) return null;
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }

    private BannerResponse toResponse(Banner b, LocalDate hoy) {
        return BannerResponse.builder()
                .id(b.getId())
                .titulo(b.getTitulo())
                .subtitulo(b.getSubtitulo())
                .textoBoton(b.getTextoBoton())
                .enlace(b.getEnlace())
                .imagenUrl(b.getImagenUrl())
                .colorFondo(b.getColorFondo() != null ? b.getColorFondo() : COLOR_POR_DEFECTO)
                .fechaInicio(b.getFechaInicio())
                .fechaFin(b.getFechaFin())
                .orden(b.getOrden())
                .activo(Boolean.TRUE.equals(b.getActivo()))
                .vigente(b.esVigente(hoy))
                .build();
    }
}

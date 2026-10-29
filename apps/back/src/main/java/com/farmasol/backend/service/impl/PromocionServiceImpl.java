package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.promocion.PromocionBannerResponse;
import com.farmasol.backend.dto.promocion.PromocionRequest;
import com.farmasol.backend.dto.promocion.PromocionResponse;
import com.farmasol.backend.exception.ResourceNotFoundException;
import com.farmasol.backend.model.Categoria;
import com.farmasol.backend.model.Producto;
import com.farmasol.backend.model.Promocion;
import com.farmasol.backend.repository.CategoriaRepository;
import com.farmasol.backend.repository.ProductoRepository;
import com.farmasol.backend.repository.PromocionRepository;
import com.farmasol.backend.service.PromocionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromocionServiceImpl implements PromocionService {

    private final PromocionRepository promocionRepository;
    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PromocionResponse> listar() {
        return promocionRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PromocionResponse obtenerPorId(Long id) {
        return toResponse(buscar(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromocionBannerResponse> listarCarrusel() {
        return promocionRepository.findByActivoTrueAndMostrarEnCarruselTrueOrderByOrden().stream()
                .filter(p -> !LocalDate.now().isBefore(p.getFechaInicio())
                        && !LocalDate.now().isAfter(p.getFechaFin()))
                .map(p -> PromocionBannerResponse.builder()
                        .id(p.getId())
                        .titulo(p.getTitulo())
                        .descripcion(p.getDescripcion())
                        .imagenBanner(p.getImagenBanner())
                        .orden(p.getOrden())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public PromocionResponse crear(PromocionRequest request) {
        Promocion promocion = Promocion.builder()
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .tipoDescuento(request.getTipoDescuento())
                .valorDescuento(request.getValorDescuento())
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .imagenBanner(request.getImagenBanner())
                .mostrarEnCarrusel(Boolean.TRUE.equals(request.getMostrarEnCarrusel()))
                .orden(request.getOrden() != null ? request.getOrden() : 0)
                .activo(true)
                .productos(resolverProductos(request.getIdsProductos()))
                .categorias(resolverCategorias(request.getIdsCategorias()))
                .build();
        return toResponse(promocionRepository.save(promocion));
    }

    @Override
    @Transactional
    public PromocionResponse actualizar(Long id, PromocionRequest request) {
        Promocion promocion = buscar(id);
        promocion.setTitulo(request.getTitulo());
        promocion.setDescripcion(request.getDescripcion());
        promocion.setTipoDescuento(request.getTipoDescuento());
        promocion.setValorDescuento(request.getValorDescuento());
        promocion.setFechaInicio(request.getFechaInicio());
        promocion.setFechaFin(request.getFechaFin());
        promocion.setImagenBanner(request.getImagenBanner());
        if (request.getMostrarEnCarrusel() != null) {
            promocion.setMostrarEnCarrusel(request.getMostrarEnCarrusel());
        }
        if (request.getOrden() != null) {
            promocion.setOrden(request.getOrden());
        }
        promocion.setProductos(resolverProductos(request.getIdsProductos()));
        promocion.setCategorias(resolverCategorias(request.getIdsCategorias()));
        return toResponse(promocionRepository.save(promocion));
    }

    @Override
    @Transactional
    public void desactivar(Long id) {
        Promocion promocion = buscar(id);
        promocion.setActivo(false);
        promocionRepository.save(promocion);
    }

    private Set<Producto> resolverProductos(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(productoRepository.findAllById(ids));
    }

    private Set<Categoria> resolverCategorias(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(categoriaRepository.findAllById(ids));
    }

    private Promocion buscar(Long id) {
        return promocionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promoción no encontrada con ID: " + id));
    }

    private PromocionResponse toResponse(Promocion p) {
        LocalDate hoy = LocalDate.now();
        boolean vigente = Boolean.TRUE.equals(p.getActivo())
                && !hoy.isBefore(p.getFechaInicio()) && !hoy.isAfter(p.getFechaFin());
        return PromocionResponse.builder()
                .id(p.getId())
                .titulo(p.getTitulo())
                .descripcion(p.getDescripcion())
                .tipoDescuento(p.getTipoDescuento())
                .valorDescuento(p.getValorDescuento())
                .fechaInicio(p.getFechaInicio())
                .fechaFin(p.getFechaFin())
                .imagenBanner(p.getImagenBanner())
                .mostrarEnCarrusel(p.getMostrarEnCarrusel())
                .orden(p.getOrden())
                .activo(p.getActivo())
                .vigente(vigente)
                .idsProductos(p.getProductos().stream().map(Producto::getId).collect(Collectors.toSet()))
                .idsCategorias(p.getCategorias().stream().map(Categoria::getId).collect(Collectors.toSet()))
                .build();
    }
}

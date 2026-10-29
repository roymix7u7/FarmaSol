package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.categoria.CategoriaRequest;
import com.farmasol.backend.dto.categoria.CategoriaResponse;
import com.farmasol.backend.exception.BusinessException;
import com.farmasol.backend.exception.ResourceNotFoundException;
import com.farmasol.backend.model.Categoria;
import com.farmasol.backend.repository.CategoriaRepository;
import com.farmasol.backend.repository.ProductoRepository;
import com.farmasol.backend.service.CategoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CategoriaServiceImpl implements CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoriaResponse> listarArbol() {
        return categoriaRepository.findByCategoriaPadreIsNullAndActivoTrueOrderByOrden()
                .stream().map(this::toResponseConHijos).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoriaResponse> listarPlano() {
        return categoriaRepository.findByActivoTrueOrderByOrden()
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoriaResponse obtenerPorId(Long id) {
        return toResponse(buscar(id));
    }

    @Override
    @Transactional
    public CategoriaResponse crear(CategoriaRequest request) {
        Categoria padre = resolverPadre(request.getIdCategoriaPadre());
        String slug = normalizarSlug(request.getSlug() != null && !request.getSlug().isBlank()
                ? request.getSlug() : request.getNombre());
        if (categoriaRepository.existsBySlug(slug)) {
            throw new BusinessException("Ya existe una categoría con el slug '" + slug + "'");
        }

        Categoria categoria = Categoria.builder()
                .nombre(request.getNombre())
                .slug(slug)
                .categoriaPadre(padre)
                .descripcion(request.getDescripcion())
                .imagenUrl(request.getImagenUrl())
                .orden(request.getOrden() != null ? request.getOrden() : 0)
                .activo(true)
                .build();

        return toResponse(categoriaRepository.save(categoria));
    }

    @Override
    @Transactional
    public CategoriaResponse actualizar(Long id, CategoriaRequest request) {
        Categoria categoria = buscar(id);
        Long idPadre = request.getIdCategoriaPadre();
        if (idPadre != null && idPadre.equals(id)) {
            throw new BusinessException("Una categoría no puede ser su propia categoría padre");
        }
        categoria.setCategoriaPadre(resolverPadre(idPadre));
        categoria.setNombre(request.getNombre());

        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            String slug = normalizarSlug(request.getSlug());
            categoriaRepository.findBySlug(slug)
                    .filter(c -> !c.getId().equals(id))
                    .ifPresent(c -> { throw new BusinessException("Slug '" + slug + "' ya usado"); });
            categoria.setSlug(slug);
        }
        categoria.setDescripcion(request.getDescripcion());
        categoria.setImagenUrl(request.getImagenUrl());
        if (request.getOrden() != null) {
            categoria.setOrden(request.getOrden());
        }
        return toResponse(categoriaRepository.save(categoria));
    }

    @Override
    @Transactional
    public void desactivar(Long id) {
        Categoria categoria = buscar(id);
        if (categoriaRepository.existsByCategoriaPadre_IdAndActivoTrue(id)) {
            throw new BusinessException("La categoría tiene subcategorías activas");
        }
        if (productoRepository.existsByCategoria_IdAndActivoTrue(id)) {
            throw new BusinessException("La categoría tiene productos activos");
        }
        categoria.setActivo(false);
        categoriaRepository.save(categoria);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> idsSubarbol(Long id) {
        List<Long> ids = categoriaRepository.findIdsSubarbol(id);
        return ids.isEmpty() ? List.of(id) : ids;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> idsAncestros(Long id) {
        List<Long> ids = categoriaRepository.findIdsAncestros(id);
        return ids.isEmpty() ? List.of(id) : ids;
    }

    private Categoria resolverPadre(Long idPadre) {
        if (idPadre == null) {
            return null;
        }
        return categoriaRepository.findById(idPadre)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría padre no encontrada con ID: " + idPadre));
    }

    private Categoria buscar(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + id));
    }

    private String normalizarSlug(String texto) {
        String normalizado = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalizado.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("[\\s-]+", "-");
    }

    private CategoriaResponse toResponse(Categoria c) {
        return CategoriaResponse.builder()
                .id(c.getId())
                .nombre(c.getNombre())
                .slug(c.getSlug())
                .idCategoriaPadre(c.getCategoriaPadre() != null ? c.getCategoriaPadre().getId() : null)
                .nombrePadre(c.getCategoriaPadre() != null ? c.getCategoriaPadre().getNombre() : null)
                .descripcion(c.getDescripcion())
                .imagenUrl(c.getImagenUrl())
                .orden(c.getOrden())
                .activo(c.getActivo())
                .build();
    }

    private CategoriaResponse toResponseConHijos(Categoria c) {
        CategoriaResponse dto = toResponse(c);
        dto.setSubcategorias(
                categoriaRepository.findByCategoriaPadre_Id(c.getId()).stream()
                        .filter(Categoria::getActivo)
                        .sorted((a, b) -> Integer.compare(
                                a.getOrden() != null ? a.getOrden() : 0,
                                b.getOrden() != null ? b.getOrden() : 0))
                        .map(this::toResponseConHijos)
                        .toList());
        return dto;
    }
}

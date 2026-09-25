package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.ProductoDTO;
import com.farmasol.backend.dto.producto.PrecioCalculadoDTO;
import com.farmasol.backend.dto.producto.ProductoResponse;
import com.farmasol.backend.exception.ResourceNotFoundException;
import com.farmasol.backend.model.Categoria;
import com.farmasol.backend.model.Producto;
import com.farmasol.backend.repository.CategoriaRepository;
import com.farmasol.backend.repository.ProductoRepository;
import com.farmasol.backend.service.CategoriaService;
import com.farmasol.backend.service.PrecioService;
import com.farmasol.backend.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final CategoriaService categoriaService;
    private final PrecioService precioService;

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponse> listar(String busqueda, Long idCategoria,
                                         boolean incluirSubcategorias, boolean soloActivos) {
        List<Producto> productos;
        if (busqueda != null && !busqueda.isBlank()) {
            productos = productoRepository.findByNombreContainingIgnoreCaseAndActivoTrue(busqueda);
        } else if (idCategoria != null) {
            List<Long> ids = incluirSubcategorias ? categoriaService.idsSubarbol(idCategoria) : List.of(idCategoria);
            productos = productoRepository.findByCategoria_IdInAndActivoTrue(ids);
        } else if (soloActivos) {
            productos = productoRepository.findByActivoTrue();
        } else {
            productos = productoRepository.findAll();
        }
        Map<Long, PrecioCalculadoDTO> precios = precioService.calcular(productos);
        return productos.stream()
                .map(p -> toResponse(p, precios.get(p.getId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponse obtenerPorId(Long id) {
        return toResponse(buscar(id));
    }

    @Override
    @Transactional
    public ProductoResponse guardar(ProductoDTO dto) {
        Producto producto = Producto.builder()
                .nombre(dto.getNombre())
                .descripcion(dto.getDescripcion())
                .precio(dto.getPrecio())
                .stock(dto.getStock())
                .categoria(buscarCategoria(dto.getIdCategoria()))
                .imagenUrl(dto.getImagenUrl())
                .requiereReceta(dto.getRequiereReceta() != null ? dto.getRequiereReceta() : false)
                .marca(dto.getMarca())
                .presentacion(dto.getPresentacion())
                .registroSanitario(dto.getRegistroSanitario())
                .activo(true)
                .build();
        return toResponse(productoRepository.save(producto));
    }

    @Override
    @Transactional
    public ProductoResponse actualizar(Long id, ProductoDTO dto) {
        Producto producto = buscar(id);
        producto.setNombre(dto.getNombre());
        producto.setDescripcion(dto.getDescripcion());
        producto.setPrecio(dto.getPrecio());
        producto.setStock(dto.getStock());
        producto.setCategoria(buscarCategoria(dto.getIdCategoria()));
        producto.setImagenUrl(dto.getImagenUrl());
        producto.setRequiereReceta(dto.getRequiereReceta() != null ? dto.getRequiereReceta() : false);
        producto.setMarca(dto.getMarca());
        producto.setPresentacion(dto.getPresentacion());
        producto.setRegistroSanitario(dto.getRegistroSanitario());
        return toResponse(productoRepository.save(producto));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        Producto producto = buscar(id);
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    private Producto buscar(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
    }

    private Categoria buscarCategoria(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + id));
    }

    private ProductoResponse toResponse(Producto p) {
        return toResponse(p, precioService.calcular(p));
    }

    private ProductoResponse toResponse(Producto p, PrecioCalculadoDTO precio) {
        return ProductoResponse.builder()
                .id(p.getId())
                .nombre(p.getNombre())
                .descripcion(p.getDescripcion())
                .precio(p.getPrecio())
                .precioFinal(precio.getPrecioFinal())
                .descuentoUnitario(precio.getDescuentoUnitario())
                .idPromocionAplicada(precio.getIdPromocionAplicada())
                .stock(p.getStock())
                .idCategoria(p.getCategoria().getId())
                .nombreCategoria(p.getCategoria().getNombre())
                .imagenUrl(p.getImagenUrl())
                .requiereReceta(p.getRequiereReceta())
                .marca(p.getMarca())
                .presentacion(p.getPresentacion())
                .registroSanitario(p.getRegistroSanitario())
                .activo(p.getActivo())
                .build();
    }
}

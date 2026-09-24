package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.carrito.AgregarItemRequest;
import com.farmasol.backend.dto.carrito.CarritoItemResponse;
import com.farmasol.backend.dto.carrito.CarritoResponse;
import com.farmasol.backend.dto.producto.PrecioCalculadoDTO;
import com.farmasol.backend.exception.BusinessException;
import com.farmasol.backend.exception.ResourceNotFoundException;
import com.farmasol.backend.model.Carrito;
import com.farmasol.backend.model.CarritoDetalle;
import com.farmasol.backend.model.Cliente;
import com.farmasol.backend.model.Producto;
import com.farmasol.backend.repository.CarritoRepository;
import com.farmasol.backend.repository.ClienteRepository;
import com.farmasol.backend.repository.ProductoRepository;
import com.farmasol.backend.service.CarritoService;
import com.farmasol.backend.service.PrecioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CarritoServiceImpl implements CarritoService {

    private final CarritoRepository carritoRepository;
    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;
    private final PrecioService precioService;

    @Override
    @Transactional
    public CarritoResponse verCarrito(Long idCliente) {
        return toResponse(obtenerOCrear(idCliente));
    }

    @Override
    @Transactional
    public CarritoResponse agregarItem(Long idCliente, AgregarItemRequest request) {
        Carrito carrito = obtenerOCrear(idCliente);
        Producto producto = productoRepository.findById(request.getIdProducto())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + request.getIdProducto()));
        if (!Boolean.TRUE.equals(producto.getActivo())) {
            throw new BusinessException("El producto no está disponible");
        }

        CarritoDetalle linea = carrito.getDetalles().stream()
                .filter(d -> d.getProducto().getId().equals(producto.getId()))
                .findFirst()
                .orElse(null);

        int nuevaCantidad = (linea != null ? linea.getCantidad() : 0) + request.getCantidad();
        if (nuevaCantidad > producto.getStock()) {
            throw new BusinessException("Stock insuficiente. Disponible: " + producto.getStock());
        }

        if (linea == null) {
            linea = CarritoDetalle.builder()
                    .carrito(carrito)
                    .producto(producto)
                    .cantidad(request.getCantidad())
                    .build();
            carrito.getDetalles().add(linea);
        } else {
            linea.setCantidad(nuevaCantidad);
        }

        return toResponse(carritoRepository.save(carrito));
    }

    @Override
    @Transactional
    public CarritoResponse actualizarCantidad(Long idCliente, Long idProducto, int cantidad) {
        Carrito carrito = obtenerOCrear(idCliente);
        CarritoDetalle linea = carrito.getDetalles().stream()
                .filter(d -> d.getProducto().getId().equals(idProducto))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("El producto no está en el carrito"));

        if (cantidad == 0) {
            carrito.getDetalles().remove(linea);
        } else {
            if (cantidad > linea.getProducto().getStock()) {
                throw new BusinessException("Stock insuficiente. Disponible: " + linea.getProducto().getStock());
            }
            linea.setCantidad(cantidad);
        }
        return toResponse(carritoRepository.save(carrito));
    }

    @Override
    @Transactional
    public CarritoResponse eliminarItem(Long idCliente, Long idProducto) {
        Carrito carrito = obtenerOCrear(idCliente);
        carrito.getDetalles().removeIf(d -> d.getProducto().getId().equals(idProducto));
        return toResponse(carritoRepository.save(carrito));
    }

    @Override
    @Transactional
    public void vaciar(Long idCliente) {
        Carrito carrito = obtenerOCrear(idCliente);
        carrito.getDetalles().clear();
        carritoRepository.save(carrito);
    }

    private Carrito obtenerOCrear(Long idCliente) {
        return carritoRepository.findByCliente_Id(idCliente).orElseGet(() -> {
            Cliente cliente = clienteRepository.findById(idCliente)
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
            return carritoRepository.save(Carrito.builder().cliente(cliente).build());
        });
    }

    private CarritoResponse toResponse(Carrito carrito) {
        List<CarritoItemResponse> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal descuentoTotal = BigDecimal.ZERO;
        int cantidadItems = 0;

        for (CarritoDetalle d : carrito.getDetalles()) {
            Producto p = d.getProducto();
            PrecioCalculadoDTO precio = precioService.calcular(p);
            BigDecimal lineaSubtotal = precio.getPrecioFinal().multiply(BigDecimal.valueOf(d.getCantidad()));
            BigDecimal lineaDescuento = precio.getDescuentoUnitario().multiply(BigDecimal.valueOf(d.getCantidad()));

            items.add(CarritoItemResponse.builder()
                    .idProducto(p.getId())
                    .nombre(p.getNombre())
                    .imagenUrl(p.getImagenUrl())
                    .precioUnitario(precio.getPrecioBase())
                    .precioFinal(precio.getPrecioFinal())
                    .descuentoUnitario(precio.getDescuentoUnitario())
                    .cantidad(d.getCantidad())
                    .subtotal(lineaSubtotal)
                    .stockDisponible(p.getStock())
                    .build());

            subtotal = subtotal.add(lineaSubtotal);
            descuentoTotal = descuentoTotal.add(lineaDescuento);
            cantidadItems += d.getCantidad();
        }

        return CarritoResponse.builder()
                .idCarrito(carrito.getId())
                .items(items)
                .cantidadItems(cantidadItems)
                .subtotal(subtotal)
                .descuentoTotal(descuentoTotal)
                .total(subtotal)
                .build();
    }
}

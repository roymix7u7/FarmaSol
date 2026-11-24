package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.producto.PrecioCalculadoDTO;
import com.farmasol.backend.dto.venta.ResumenCajaDTO;
import com.farmasol.backend.dto.venta.VentaRequest;
import com.farmasol.backend.dto.venta.VentaResponse;
import com.farmasol.backend.exception.BusinessException;
import com.farmasol.backend.exception.ResourceNotFoundException;
import com.farmasol.backend.model.Personal;
import com.farmasol.backend.model.Producto;
import com.farmasol.backend.model.Venta;
import com.farmasol.backend.model.VentaDetalle;
import com.farmasol.backend.model.enums.MetodoPago;
import com.farmasol.backend.model.enums.RolPersonal;
import com.farmasol.backend.repository.PersonalRepository;
import com.farmasol.backend.repository.ProductoRepository;
import com.farmasol.backend.repository.VentaRepository;
import com.farmasol.backend.security.SecurityUtils;
import com.farmasol.backend.service.PrecioService;
import com.farmasol.backend.service.VentaService;
import com.farmasol.backend.validation.Reglas;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Year;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VentaServiceImpl implements VentaService {

    private static final BigDecimal UMBRAL_BOLETA = new BigDecimal(Reglas.UMBRAL_BOLETA_IDENTIFICADA);

    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;
    private final PersonalRepository personalRepository;
    private final PrecioService precioService;

    @Override
    @Transactional
    public VentaResponse registrar(VentaRequest request) {
        Personal vendedor = personalActual();

        // 1. Unir líneas repetidas del mismo producto: escanear dos veces la
        //    misma caja no debe dar dos líneas ni saltarse el control de stock.
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        Map<Long, Boolean> recetaVista = new LinkedHashMap<>();
        for (VentaRequest.Item item : request.getItems()) {
            cantidades.merge(item.getIdProducto(), item.getCantidad(), Integer::sum);
            recetaVista.merge(item.getIdProducto(), item.isRecetaVerificada(), Boolean::logicalOr);
        }

        // 2. Leer los productos bloqueados, para que nadie más venda el mismo
        //    stock mientras esta venta no termine.
        List<Producto> productos = productoRepository.findAllByIdInParaVenta(cantidades.keySet());
        if (productos.size() != cantidades.size()) {
            throw new ResourceNotFoundException("Uno de los productos de la venta ya no existe");
        }
        Map<Long, Producto> porId = productos.stream()
                .collect(Collectors.toMap(Producto::getId, Function.identity()));

        // 3. Reglas de cada producto, en el orden en que el cajero los cargó.
        for (Map.Entry<Long, Integer> e : cantidades.entrySet()) {
            Producto p = porId.get(e.getKey());
            int cantidad = e.getValue();
            if (!Boolean.TRUE.equals(p.getActivo())) {
                throw new BusinessException("'" + p.getNombre() + "' ya no está a la venta");
            }
            if (cantidad > 999) {
                throw new BusinessException("La cantidad máxima por producto es 999");
            }
            if (cantidad > p.getStock()) {
                throw new BusinessException("Stock insuficiente para '" + p.getNombre()
                        + "'. Disponible: " + p.getStock());
            }
            if (Boolean.TRUE.equals(p.getRequiereReceta()) && !recetaVista.get(e.getKey())) {
                throw new BusinessException("'" + p.getNombre()
                        + "' requiere receta médica: confirma que revisaste la receta física");
            }
        }

        // 4. Precios del servidor, con las promociones vigentes. Nunca del cliente.
        Map<Long, PrecioCalculadoDTO> precios = precioService.calcular(productos);

        Venta venta = Venta.builder()
                .vendidoPor(vendedor)
                .metodoPago(request.getMetodoPago())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal descuento = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> e : cantidades.entrySet()) {
            Producto p = porId.get(e.getKey());
            int cantidad = e.getValue();
            PrecioCalculadoDTO precio = precios.get(p.getId());
            BigDecimal cant = BigDecimal.valueOf(cantidad);

            venta.getDetalles().add(VentaDetalle.builder()
                    .venta(venta)
                    .producto(p)
                    .nombreProducto(p.getNombre())
                    .precioUnitario(precio.getPrecioBase())
                    .descuentoUnitario(precio.getDescuentoUnitario())
                    .cantidad(cantidad)
                    .subtotal(precio.getPrecioFinal().multiply(cant).setScale(2, RoundingMode.HALF_UP))
                    .requiereReceta(Boolean.TRUE.equals(p.getRequiereReceta()))
                    .recetaVerificada(Boolean.TRUE.equals(p.getRequiereReceta()) && recetaVista.get(e.getKey()))
                    .build());

            subtotal = subtotal.add(precio.getPrecioBase().multiply(cant));
            descuento = descuento.add(precio.getDescuentoUnitario().multiply(cant));
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);
        descuento = descuento.setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.subtract(descuento).setScale(2, RoundingMode.HALF_UP);

        venta.setSubtotal(subtotal);
        venta.setDescuentoTotal(descuento);
        venta.setTotal(total);

        aplicarComprador(venta, request.getCliente(), total);
        aplicarPago(venta, request, total);

        // 5. Descontar el stock. Los productos siguen bloqueados hasta el commit.
        for (Map.Entry<Long, Integer> e : cantidades.entrySet()) {
            Producto p = porId.get(e.getKey());
            p.setStock(p.getStock() - e.getValue());
        }

        Venta guardada = ventaRepository.save(venta);
        guardada.setCodigoVenta("VTA-" + Year.now() + "-" + String.format("%06d", guardada.getId()));
        return toResponse(guardada);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VentaResponse> listarDelDia(LocalDate fecha) {
        return ventasDelDia(fecha).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ResumenCajaDTO resumenCaja(LocalDate fecha) {
        LocalDate dia = fecha != null ? fecha : LocalDate.now();
        List<Venta> ventas = ventasDelDia(dia);

        Map<MetodoPago, BigDecimal> totalPorMetodo = new EnumMap<>(MetodoPago.class);
        Map<MetodoPago, Long> cantidadPorMetodo = new EnumMap<>(MetodoPago.class);
        for (MetodoPago m : MetodoPago.values()) {
            totalPorMetodo.put(m, BigDecimal.ZERO);
            cantidadPorMetodo.put(m, 0L);
        }

        BigDecimal total = BigDecimal.ZERO;
        BigDecimal anulado = BigDecimal.ZERO;
        long cantidad = 0;
        long anuladas = 0;
        for (Venta v : ventas) {
            if (Boolean.TRUE.equals(v.getAnulada())) {
                anuladas++;
                anulado = anulado.add(v.getTotal());
                continue;
            }
            cantidad++;
            total = total.add(v.getTotal());
            totalPorMetodo.merge(v.getMetodoPago(), v.getTotal(), BigDecimal::add);
            cantidadPorMetodo.merge(v.getMetodoPago(), 1L, Long::sum);
        }

        return ResumenCajaDTO.builder()
                .fecha(dia)
                .todoElPersonal(esGerente())
                .cantidadVentas(cantidad)
                .totalVendido(total)
                // El vuelto ya salió del cajón: lo que queda es el total cobrado en efectivo.
                .efectivoEnCaja(totalPorMetodo.get(MetodoPago.EFECTIVO))
                .totalPorMetodo(totalPorMetodo)
                .cantidadPorMetodo(cantidadPorMetodo)
                .cantidadAnuladas(anuladas)
                .montoAnulado(anulado)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public VentaResponse obtener(Long id) {
        return toResponse(buscarVisible(id));
    }

    @Override
    @Transactional
    public VentaResponse anular(Long id, String motivo) {
        Venta venta = ventaRepository.findWithDetallesById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada"));
        if (Boolean.TRUE.equals(venta.getAnulada())) {
            throw new BusinessException("Esta venta ya fue anulada");
        }

        // Devolver el stock con los productos bloqueados, igual que al vender.
        Map<Long, Integer> devolver = new LinkedHashMap<>();
        for (VentaDetalle d : venta.getDetalles()) {
            if (d.getProducto() != null) {
                devolver.merge(d.getProducto().getId(), d.getCantidad(), Integer::sum);
            }
        }
        if (!devolver.isEmpty()) {
            for (Producto p : productoRepository.findAllByIdInParaVenta(devolver.keySet())) {
                p.setStock(p.getStock() + devolver.get(p.getId()));
            }
        }

        venta.setAnulada(true);
        venta.setAnuladaPor(personalActual());
        venta.setFechaAnulacion(LocalDateTime.now());
        venta.setMotivoAnulacion(motivo.strip());
        return toResponse(venta);
    }

    // ------------------------------------------------------------------ ayudas

    private void aplicarComprador(Venta venta, VentaRequest.Comprador c, BigDecimal total) {
        boolean identificado = c != null && c.getTipoDocumento() != null
                && c.getDocumento() != null && !c.getDocumento().isBlank();
        if (total.compareTo(UMBRAL_BOLETA) > 0 && !identificado) {
            throw new BusinessException("Para ventas mayores a S/ " + UMBRAL_BOLETA
                    + " la boleta debe identificar al comprador: tipo y número de documento y nombre");
        }
        if (identificado) {
            venta.setClienteTipoDocumento(c.getTipoDocumento());
            venta.setClienteDocumento(c.getTipoDocumento().normalizar(c.getDocumento()));
            venta.setClienteNombre(c.getNombre().strip());
        }
    }

    private void aplicarPago(Venta venta, VentaRequest req, BigDecimal total) {
        switch (req.getMetodoPago()) {
            case EFECTIVO -> {
                BigDecimal recibido = req.getMontoRecibido().setScale(2, RoundingMode.HALF_UP);
                if (recibido.compareTo(total) < 0) {
                    throw new BusinessException("El monto recibido (S/ " + recibido
                            + ") no cubre el total (S/ " + total + ")");
                }
                venta.setMontoRecibido(recibido);
                venta.setVuelto(recibido.subtract(total));
            }
            case YAPE -> {
                venta.setMontoRecibido(total);
                venta.setCodigoOperacion(req.getCodigoOperacion().strip());
            }
            case TARJETA -> {
                venta.setMontoRecibido(total);
                venta.setCodigoOperacion(req.getCodigoOperacion().strip());
                venta.setTarjetaMarca(req.getTarjetaMarca());
                venta.setTarjetaUltimos4(req.getTarjetaUltimos4().strip());
            }
        }
    }

    private List<Venta> ventasDelDia(LocalDate fecha) {
        LocalDate dia = fecha != null ? fecha : LocalDate.now();
        LocalDateTime desde = dia.atStartOfDay();
        LocalDateTime hasta = dia.atTime(LocalTime.MAX);
        return esGerente()
                ? ventaRepository.listarEntre(desde, hasta)
                : ventaRepository.listarEntreDeVendedor(desde, hasta, SecurityUtils.getUidActual());
    }

    /** El empleado solo puede ver sus propias ventas; el gerente, todas. */
    private Venta buscarVisible(Long id) {
        Venta venta = ventaRepository.findWithDetallesById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada"));
        if (!esGerente() && !venta.getVendidoPor().getId().equals(SecurityUtils.getUidActual())) {
            // 404 y no 403: no confirmar que existe una venta ajena.
            throw new ResourceNotFoundException("Venta no encontrada");
        }
        return venta;
    }

    private Personal personalActual() {
        Personal p = personalRepository.findById(SecurityUtils.getUidActual())
                .orElseThrow(() -> new ResourceNotFoundException("Personal no encontrado"));
        // El token sigue vigente aunque desactiven la cuenta: sin esto, alguien
        // dado de baja podría seguir cobrando hasta que expire su sesión.
        if (!Boolean.TRUE.equals(p.getActivo())) {
            throw new BusinessException("Tu cuenta está desactivada: no puedes registrar ventas");
        }
        return p;
    }

    private boolean esGerente() {
        return RolPersonal.GERENTE.name().equals(SecurityUtils.actual().getRol());
    }

    private VentaResponse toResponse(Venta v) {
        List<VentaResponse.Linea> lineas = v.getDetalles().stream()
                .map(d -> VentaResponse.Linea.builder()
                        .idProducto(d.getProducto() != null ? d.getProducto().getId() : null)
                        .nombreProducto(d.getNombreProducto())
                        .precioUnitario(d.getPrecioUnitario())
                        .descuentoUnitario(d.getDescuentoUnitario())
                        .cantidad(d.getCantidad())
                        .subtotal(d.getSubtotal())
                        .requiereReceta(Boolean.TRUE.equals(d.getRequiereReceta()))
                        .recetaVerificada(Boolean.TRUE.equals(d.getRecetaVerificada()))
                        .build())
                .toList();

        return VentaResponse.builder()
                .id(v.getId())
                .codigoVenta(v.getCodigoVenta())
                .fechaVenta(v.getFechaVenta())
                .idVendedor(v.getVendidoPor().getId())
                .vendidoPor(nombreDe(v.getVendidoPor()))
                .clienteTipoDocumento(v.getClienteTipoDocumento())
                .clienteDocumento(v.getClienteDocumento())
                .clienteNombre(v.getClienteNombre())
                .detalles(lineas)
                .cantidadItems(lineas.stream().mapToInt(VentaResponse.Linea::getCantidad).sum())
                .subtotal(v.getSubtotal())
                .descuentoTotal(v.getDescuentoTotal())
                .total(v.getTotal())
                .metodoPago(v.getMetodoPago())
                .montoRecibido(v.getMontoRecibido())
                .vuelto(v.getVuelto())
                .codigoOperacion(v.getCodigoOperacion())
                .tarjetaMarca(v.getTarjetaMarca())
                .tarjetaUltimos4(v.getTarjetaUltimos4())
                .anulada(Boolean.TRUE.equals(v.getAnulada()))
                .anuladaPor(v.getAnuladaPor() != null ? nombreDe(v.getAnuladaPor()) : null)
                .fechaAnulacion(v.getFechaAnulacion())
                .motivoAnulacion(v.getMotivoAnulacion())
                .build();
    }

    private static String nombreDe(Personal p) {
        return p.getNombres() + " " + p.getApellidos();
    }
}

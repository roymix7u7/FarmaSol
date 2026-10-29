package com.farmasol.backend.service.impl;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;

import com.farmasol.backend.dto.pedido.CheckoutRequest;
import com.farmasol.backend.dto.pedido.PedidoDetalleResponse;
import com.farmasol.backend.dto.pedido.PedidoResponse;
import com.farmasol.backend.dto.pedido.PedidoResumenResponse;
import com.farmasol.backend.dto.producto.PrecioCalculadoDTO;
import com.farmasol.backend.exception.BusinessException;
import com.farmasol.backend.exception.ResourceNotFoundException;
import com.farmasol.backend.model.*;
import com.farmasol.backend.model.enums.EstadoPedido;
import com.farmasol.backend.model.enums.EstadoReceta;
import com.farmasol.backend.model.enums.TipoEntrega;
import com.farmasol.backend.repository.*;
import com.farmasol.backend.service.PedidoService;
import com.farmasol.backend.service.PrecioService;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PedidoServiceImpl implements PedidoService {

    private final PedidoRepository pedidoRepository;
    private final CarritoRepository carritoRepository;
    private final DireccionRepository direccionRepository;
    private final ProductoRepository productoRepository;
    private final PersonalRepository personalRepository;
    private final SedeRepository sedeRepository;
    private final RecetaRepository recetaRepository;
    private final PrecioService precioService;

    @Value("${farmasol.pedido.costo-envio:0}")
    private BigDecimal costoEnvio;

    @Override
    @Transactional
    public List<PedidoResponse> checkout(Long idCliente, CheckoutRequest request) {
        Carrito carrito = carritoRepository.findByCliente_Id(idCliente)
                .orElseThrow(() -> new BusinessException("El carrito está vacío"));
        if (carrito.getDetalles().isEmpty()) {
            throw new BusinessException("El carrito está vacío");
        }

        List<CarritoDetalle> sinReceta = new ArrayList<>();
        List<CarritoDetalle> conReceta = new ArrayList<>();
        for (CarritoDetalle linea : carrito.getDetalles()) {
            if (Boolean.TRUE.equals(linea.getProducto().getRequiereReceta())) {
                conReceta.add(linea);
            } else {
                sinReceta.add(linea);
            }
        }

        List<Pedido> pedidosCreados = new ArrayList<>();
        if (!sinReceta.isEmpty()) {
            pedidosCreados.add(armarPedido(carrito.getCliente(), request, sinReceta, false, pedidosCreados.isEmpty()));
        }
        if (!conReceta.isEmpty()) {
            pedidosCreados.add(armarPedido(carrito.getCliente(), request, conReceta, true, pedidosCreados.isEmpty()));
        }

        carrito.getDetalles().clear();
        carritoRepository.save(carrito);

        return pedidosCreados.stream().map(this::toResponse).toList();
    }

    private Pedido armarPedido(Cliente cliente, CheckoutRequest request, List<CarritoDetalle> lineas,
                               boolean conReceta, boolean incluyeCostoEnvio) {
        Pedido.PedidoBuilder builder = Pedido.builder()
                .cliente(cliente)
                .estado(EstadoPedido.PENDIENTE)
                .tipoEntrega(request.getTipoEntrega())
                .requiereReceta(conReceta)
                .costoEnvio(incluyeCostoEnvio && costoEnvio != null ? costoEnvio : BigDecimal.ZERO)
                .notas(request.getNotas());

        if (request.getTipoEntrega() == TipoEntrega.DELIVERY) {
            Direccion direccion = direccionRepository.findByIdAndCliente_Id(request.getIdDireccion(), cliente.getId())
                    .filter(Direccion::getActivo)
                    .orElseThrow(() -> new ResourceNotFoundException("Dirección no encontrada con ID: " + request.getIdDireccion()));
            builder.direccion(direccion)
                    .envioQuienRecibe(direccion.getQuienRecibe())
                    .envioTelefono(direccion.getTelefonoContacto())
                    .envioDireccion(direccion.getDireccion())
                    .envioDistrito(direccion.getDistrito())
                    .envioReferencia(direccion.getReferencia());
        } else {
            Sede sede = sedeRepository.findById(request.getIdSede())
                    .filter(Sede::getActivo)
                    .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada con ID: " + request.getIdSede()));
            builder.recojoSede(sede.getNombre() + " - " + sede.getDireccion())
                    .recojoNombre(request.getRecojoNombre())
                    .recojoDni(request.getRecojoDni());
        }

        Pedido pedido = builder.build();

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal descuentoTotal = BigDecimal.ZERO;

        Map<Long, PrecioCalculadoDTO> precios = precioService.calcular(
                lineas.stream().map(CarritoDetalle::getProducto).toList());

        for (CarritoDetalle linea : lineas) {
            Producto producto = linea.getProducto();
            if (linea.getCantidad() > producto.getStock()) {
                throw new BusinessException("Stock insuficiente para '" + producto.getNombre()
                        + "'. Disponible: " + producto.getStock());
            }
            PrecioCalculadoDTO precio = precios.get(producto.getId());
            BigDecimal lineaSubtotal = precio.getPrecioFinal().multiply(BigDecimal.valueOf(linea.getCantidad()));

            PedidoDetalle detalle = PedidoDetalle.builder()
                    .pedido(pedido)
                    .producto(producto)
                    .nombreProducto(producto.getNombre())
                    .precioUnitario(precio.getPrecioBase())
                    .descuentoUnitario(precio.getDescuentoUnitario())
                    .cantidad(linea.getCantidad())
                    .subtotal(lineaSubtotal)
                    .requiereReceta(conReceta)
                    .build();
            pedido.getDetalles().add(detalle);

            producto.setStock(producto.getStock() - linea.getCantidad());

            subtotal = subtotal.add(precio.getPrecioBase().multiply(BigDecimal.valueOf(linea.getCantidad())));
            descuentoTotal = descuentoTotal.add(precio.getDescuentoUnitario().multiply(BigDecimal.valueOf(linea.getCantidad())));
        }

        BigDecimal total = subtotal.subtract(descuentoTotal).add(pedido.getCostoEnvio()).max(BigDecimal.ZERO);
        pedido.setSubtotal(subtotal);
        pedido.setDescuentoTotal(descuentoTotal);
        pedido.setTotal(total);

        Pedido guardado = pedidoRepository.save(pedido);
        String sufijo = conReceta ? "-R" : "";
        guardado.setCodigoPedido("PED-" + Year.now() + "-" + String.format("%06d", guardado.getId()) + sufijo);
        Pedido pedidoFinal = pedidoRepository.save(guardado);

        if (conReceta) {
            List<Receta> recetasProvisionales = recetaRepository.findByPedidoDetalleIsNull();
            int index = 0;
            for (PedidoDetalle d : pedidoFinal.getDetalles()) {
                if (Boolean.TRUE.equals(d.getRequiereReceta()) && index < recetasProvisionales.size()) {
                    Receta r = recetasProvisionales.get(index++);
                    r.setPedidoDetalle(d);
                    recetaRepository.save(r);
                }
            }
        }

        return pedidoFinal;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PedidoResumenResponse> listarDeCliente(Long idCliente) {
        return pedidoRepository.findByCliente_IdOrderByFechaPedidoDesc(idCliente)
                .stream().map(this::toResumen).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PedidoResponse obtenerDeCliente(Long idCliente, Long idPedido) {
        Pedido pedido = pedidoRepository.findByIdAndCliente_Id(idPedido, idCliente)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado con ID: " + idPedido));
        return toResponse(pedido);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PedidoResumenResponse> listarTodos(EstadoPedido filtroEstado) {
        List<Pedido> pedidos = (filtroEstado != null)
                ? pedidoRepository.findByEstadoOrderByFechaPedidoDesc(filtroEstado)
                : pedidoRepository.findAllByOrderByFechaPedidoDesc();
        return pedidos.stream().map(this::toResumen).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PedidoResponse obtenerAdmin(Long idPedido) {
        return toResponse(buscar(idPedido));
    }

    @Override
    @Transactional
    public PedidoResponse cambiarEstado(Long idPersonal, Long idPedido, EstadoPedido nuevoEstado) {
        Pedido pedido = buscar(idPedido);
        if (!pedido.getEstado().puedeTransicionarA(nuevoEstado)) {
            throw new BusinessException("No se puede pasar de " + pedido.getEstado() + " a " + nuevoEstado);
        }

        Personal personal = personalRepository.findById(idPersonal).orElse(null);
        if (pedido.getAtendidoPor() == null) {
            pedido.setAtendidoPor(personal);
        }

        switch (nuevoEstado) {
            case CONFIRMADO -> {
                if (Boolean.TRUE.equals(pedido.getRequiereReceta()) && !todasLasRecetasAprobadas(pedido)) {
                    throw new BusinessException("El pedido tiene productos con receta pendientes de aprobación");
                }
                pedido.setFechaConfirmacion(LocalDateTime.now());
                pedido.setAtendidoPor(personal);
            }
            case ENTREGADO -> pedido.setFechaEntrega(LocalDateTime.now());
            case CANCELADO -> reponerStock(pedido);
            default -> { }
        }

        pedido.setEstado(nuevoEstado);
        return toResponse(pedidoRepository.save(pedido));
    }
// =========================================================================
    // MÉTODO IMPLEMENTADO PARA LA GENERACIÓN DEL COMPROBANTE PDF
    // =========================================================================
   @Override
    @Transactional(readOnly = true)
    public byte[] generarComprobantePdf(Long idPedido) {
        Pedido pedido = pedidoRepository.findWithDetallesById(idPedido)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado con ID: " + idPedido));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            BaseColor colorVerde = new BaseColor(16, 185, 129);
            BaseColor colorGrisOscuro = new BaseColor(31, 41, 55);

            // Título
            Font fontTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, colorVerde);
            Paragraph titulo = new Paragraph("FarmaSOL - Comprobante Electrónico", fontTitulo);
            titulo.setAlignment(Element.ALIGN_CENTER);
            document.add(titulo);

            Font fontSub = FontFactory.getFont(FontFactory.HELVETICA, 11, colorGrisOscuro);
            Paragraph sub = new Paragraph("Boleta de Venta / Nota de Pedido", fontSub);
            sub.setAlignment(Element.ALIGN_CENTER);
            sub.setSpacingAfter(15);
            document.add(sub);

            // Datos Generales
            Font fontNegrita = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, colorGrisOscuro);
            Font fontNormal = FontFactory.getFont(FontFactory.HELVETICA, 10, colorGrisOscuro);

            document.add(new Paragraph("Código de Pedido: " + pedido.getCodigoPedido(), fontNegrita));
            document.add(new Paragraph("Cliente: " + pedido.getCliente().getNombres() + " " + pedido.getCliente().getApellidos(), fontNormal));
            document.add(new Paragraph("Fecha de Pedido: " + pedido.getFechaPedido(), fontNormal));
            document.add(new Paragraph("Tipo de Entrega: " + pedido.getTipoEntrega(), fontNormal));
            
            if (pedido.getRecojoSede() != null) {
                document.add(new Paragraph("Sede de Recojo: " + pedido.getRecojoSede(), fontNormal));
                document.add(new Paragraph("Recoge: " + pedido.getRecojoNombre() + " (DNI: " + pedido.getRecojoDni() + ")", fontNormal));
            }

            Paragraph espacio = new Paragraph(" ");
            espacio.setSpacingAfter(10);
            document.add(espacio);

            // Tabla de Detalle
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{4f, 1f, 1.5f, 1.5f});

            String[] headers = {"Producto", "Cant.", "P. Unitario", "Subtotal"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE)));
                cell.setBackgroundColor(colorVerde);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6);
                table.addCell(cell);
            }

            for (PedidoDetalle d : pedido.getDetalles()) {
                table.addCell(new PdfPCell(new Phrase(d.getNombreProducto(), fontNormal)));
                
                PdfPCell cellCant = new PdfPCell(new Phrase(String.valueOf(d.getCantidad()), fontNormal));
                cellCant.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cellCant);

                PdfPCell cellPrecio = new PdfPCell(new Phrase("S/ " + String.format("%.2f", d.getPrecioUnitario()), fontNormal));
                cellPrecio.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(cellPrecio);

                PdfPCell cellSub = new PdfPCell(new Phrase("S/ " + String.format("%.2f", d.getSubtotal()), fontNormal));
                cellSub.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(cellSub);
            }

            document.add(table);

            // Totales
            Paragraph totales = new Paragraph();
            totales.setAlignment(Element.ALIGN_RIGHT);
            totales.setSpacingBefore(15);
            totales.add(new Paragraph("Subtotal: S/ " + String.format("%.2f", pedido.getSubtotal()), fontNormal));
            totales.add(new Paragraph("Costo de Envío: S/ " + String.format("%.2f", pedido.getCostoEnvio()), fontNormal));
            if (pedido.getDescuentoTotal() != null && pedido.getDescuentoTotal().compareTo(BigDecimal.ZERO) > 0) {
                totales.add(new Paragraph("Descuentos: -S/ " + String.format("%.2f", pedido.getDescuentoTotal()), fontNormal));
            }
            totales.add(new Paragraph("Total Pagado: S/ " + String.format("%.2f", pedido.getTotal()), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, colorVerde)));
            
            document.add(totales);

            document.close();
        } catch (DocumentException e) {
            throw new BusinessException("Error al generar el comprobante PDF del pedido");
        }

        return baos.toByteArray();
    }

    private boolean todasLasRecetasAprobadas(Pedido pedido) {
        for (PedidoDetalle d : pedido.getDetalles()) {
            if (!Boolean.TRUE.equals(d.getRequiereReceta())) {
                continue;
            }
            boolean aprobada = recetaRepository.findFirstByPedidoDetalle_IdOrderByFechaSubidaDesc(d.getId())
                    .map(r -> r.getEstado() == EstadoReceta.APROBADA)
                    .orElse(false);
            if (!aprobada) {
                return false;
            }
        }
        return true;
    }

    private void reponerStock(Pedido pedido) {
        for (PedidoDetalle d : pedido.getDetalles()) {
            if (d.getProducto() != null) {
                Producto p = d.getProducto();
                p.setStock(p.getStock() + d.getCantidad());
                productoRepository.save(p);
            }
        }
    }

    private Pedido buscar(Long id) {
        return pedidoRepository.findWithDetallesById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado con ID: " + id));
    }

    private PedidoResumenResponse toResumen(Pedido p) {
        int items = p.getDetalles().stream().mapToInt(PedidoDetalle::getCantidad).sum();
        return PedidoResumenResponse.builder()
                .id(p.getId())
                .codigoPedido(p.getCodigoPedido())
                .nombreCliente(p.getCliente().getNombres() + " " + p.getCliente().getApellidos())
                .estado(p.getEstado())
                .requiereReceta(p.getRequiereReceta())
                .total(p.getTotal())
                .cantidadItems(items)
                .fechaPedido(p.getFechaPedido())
                .build();
    }

    private PedidoResponse toResponse(Pedido p) {
        List<PedidoDetalleResponse> detalles = new ArrayList<>();
        for (PedidoDetalle d : p.getDetalles()) {
            var detalleBuilder = PedidoDetalleResponse.builder()
                    .idPedidoDetalle(d.getId())
                    .idProducto(d.getProducto() != null ? d.getProducto().getId() : null)
                    .nombreProducto(d.getNombreProducto())
                    .precioUnitario(d.getPrecioUnitario())
                    .descuentoUnitario(d.getDescuentoUnitario())
                    .cantidad(d.getCantidad())
                    .subtotal(d.getSubtotal())
                    .requiereReceta(d.getRequiereReceta());

            if (Boolean.TRUE.equals(d.getRequiereReceta())) {
                recetaRepository.findFirstByPedidoDetalle_IdOrderByFechaSubidaDesc(d.getId())
                        .ifPresent(r -> detalleBuilder.idRecetaVigente(r.getId()).estadoReceta(r.getEstado()));
            }
            detalles.add(detalleBuilder.build());
        }
        return PedidoResponse.builder()
                .id(p.getId())
                .codigoPedido(p.getCodigoPedido())
                .idCliente(p.getCliente().getId())
                .nombreCliente(p.getCliente().getNombres() + " " + p.getCliente().getApellidos())
                .estado(p.getEstado())
                .tipoEntrega(p.getTipoEntrega())
                .requiereReceta(p.getRequiereReceta())
                .subtotal(p.getSubtotal())
                .descuentoTotal(p.getDescuentoTotal())
                .costoEnvio(p.getCostoEnvio())
                .total(p.getTotal())
                .envioQuienRecibe(p.getEnvioQuienRecibe())
                .envioTelefono(p.getEnvioTelefono())
                .envioDireccion(p.getEnvioDireccion())
                .envioDistrito(p.getEnvioDistrito())
                .envioReferencia(p.getEnvioReferencia())
                .recojoSede(p.getRecojoSede())
                .recojoNombre(p.getRecojoNombre())
                .recojoDni(p.getRecojoDni())
                .fechaPedido(p.getFechaPedido())
                .fechaConfirmacion(p.getFechaConfirmacion())
                .fechaEntrega(p.getFechaEntrega())
                .atendidoPor(p.getAtendidoPor() != null ? p.getAtendidoPor().getUsuario() : null)
                .notas(p.getNotas())
                .detalles(detalles)
                .build();
    }
}
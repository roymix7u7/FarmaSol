package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.receta.ArchivoRecetaDTO;
import com.farmasol.backend.dto.receta.RecetaResponse;
import com.farmasol.backend.exception.BusinessException;
import com.farmasol.backend.exception.ResourceNotFoundException;
import com.farmasol.backend.model.PedidoDetalle;
import com.farmasol.backend.model.Personal;
import com.farmasol.backend.model.Receta;
import com.farmasol.backend.model.enums.EstadoReceta;
import com.farmasol.backend.repository.PedidoDetalleRepository;
import com.farmasol.backend.repository.PersonalRepository;
import com.farmasol.backend.repository.RecetaRepository;
import com.farmasol.backend.security.SecurityUtils;
import com.farmasol.backend.security.TipoUsuario;
import com.farmasol.backend.service.RecetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecetaServiceImpl implements RecetaService {

    private static final Set<String> TIPOS_PERMITIDOS = Set.of("image/jpeg", "image/png", "application/pdf");
    private static final long TAMANO_MAXIMO_BYTES = 5L * 1024 * 1024; // 5 MB

    private final RecetaRepository recetaRepository;
    private final PedidoDetalleRepository pedidoDetalleRepository;
    private final PersonalRepository personalRepository;

    @Value("${farmasol.uploads.dir:./uploads}")
    private String directorioUploads;

    @Override
    @Transactional
    public RecetaResponse subir(Long idCliente, Long idPedidoDetalle, MultipartFile archivo) {
        PedidoDetalle detalle = pedidoDetalleRepository.findById(idPedidoDetalle)
                .orElseThrow(() -> new ResourceNotFoundException("Línea de pedido no encontrada"));

        if (!detalle.getPedido().getCliente().getId().equals(idCliente)) {
            throw new ResourceNotFoundException("Línea de pedido no encontrada");
        }
        if (!Boolean.TRUE.equals(detalle.getRequiereReceta())) {
            throw new BusinessException("Este producto no requiere receta médica");
        }
        validarArchivo(archivo);

        String ruta = guardarArchivo(archivo);

        Receta receta = Receta.builder()
                .pedidoDetalle(detalle)
                .archivoRuta(ruta)
                .tipoContenido(archivo.getContentType())
                .estado(EstadoReceta.PENDIENTE_REVISION)
                .build();

        return toResponse(recetaRepository.save(receta));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecetaResponse> listarDePedido(Long idPedido) {
        List<Receta> recetas = recetaRepository.findByPedidoDetalle_Pedido_IdOrderByFechaSubidaDesc(idPedido);
        if (!recetas.isEmpty()) {
            verificarAcceso(recetas.get(0));
        }
        return recetas.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecetaResponse> listarPendientes() {
        return recetaRepository.findByEstadoOrderByFechaSubidaAsc(EstadoReceta.PENDIENTE_REVISION)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public RecetaResponse aprobar(Long idPersonal, Long idReceta) {
        Receta receta = buscar(idReceta);
        Personal personal = personalRepository.findById(idPersonal).orElse(null);
        receta.setEstado(EstadoReceta.APROBADA);
        receta.setMotivoRechazo(null);
        receta.setRevisadoPor(personal);
        receta.setFechaRevision(LocalDateTime.now());
        return toResponse(recetaRepository.save(receta));
    }

    @Override
    @Transactional
    public RecetaResponse rechazar(Long idPersonal, Long idReceta, String motivo) {
        Receta receta = buscar(idReceta);
        Personal personal = personalRepository.findById(idPersonal).orElse(null);
        receta.setEstado(EstadoReceta.RECHAZADA);
        receta.setMotivoRechazo(motivo);
        receta.setRevisadoPor(personal);
        receta.setFechaRevision(LocalDateTime.now());
        return toResponse(recetaRepository.save(receta));
    }

    @Override
    @Transactional(readOnly = true)
    public ArchivoRecetaDTO obtenerArchivo(Long idReceta) {
        Receta receta = buscar(idReceta);
        verificarAcceso(receta);

        Path ruta = Path.of(directorioUploads).resolve(receta.getArchivoRuta());
        try {
            byte[] contenido = Files.readAllBytes(ruta);
            return new ArchivoRecetaDTO(contenido, receta.getTipoContenido(), ruta.getFileName().toString());
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo de la receta", e);
        }
    }

    /** El cliente dueño del pedido, o cualquier personal, pueden ver/listar la receta. */
    private void verificarAcceso(Receta receta) {
        var actual = SecurityUtils.actual();
        if (actual.getTipo() == TipoUsuario.PERSONAL) {
            return;
        }
        Long idClienteDueno = receta.getPedidoDetalle().getPedido().getCliente().getId();
        if (!idClienteDueno.equals(actual.getUid())) {
            throw new ResourceNotFoundException("Receta no encontrada");
        }
    }

    private void validarArchivo(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new BusinessException("Debes adjuntar un archivo");
        }
        if (archivo.getSize() > TAMANO_MAXIMO_BYTES) {
            throw new BusinessException("El archivo no puede superar los 5 MB");
        }
        if (!TIPOS_PERMITIDOS.contains(archivo.getContentType())) {
            throw new BusinessException("Formato no permitido. Solo se aceptan JPG, PNG o PDF");
        }
    }

    private String guardarArchivo(MultipartFile archivo) {
        try {
            Path carpeta = Path.of(directorioUploads, "recetas");
            Files.createDirectories(carpeta);

            String extension = switch (archivo.getContentType()) {
                case "image/png" -> ".png";
                case "application/pdf" -> ".pdf";
                default -> ".jpg";
            };
            String nombre = UUID.randomUUID() + extension;
            Path destino = carpeta.resolve(nombre);
            archivo.transferTo(destino);
            return "recetas/" + nombre;
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar el archivo de la receta", e);
        }
    }

    private Receta buscar(Long id) {
        return recetaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Receta no encontrada con ID: " + id));
    }

    private RecetaResponse toResponse(Receta r) {
        PedidoDetalle d = r.getPedidoDetalle();
        return RecetaResponse.builder()
                .id(r.getId())
                .idPedido(d.getPedido().getId())
                .codigoPedido(d.getPedido().getCodigoPedido())
                .idPedidoDetalle(d.getId())
                .nombreProducto(d.getNombreProducto())
                .cantidad(d.getCantidad())
                .nombreCliente(d.getPedido().getCliente().getNombres() + " " + d.getPedido().getCliente().getApellidos())
                .estado(r.getEstado())
                .motivoRechazo(r.getMotivoRechazo())
                .revisadoPor(r.getRevisadoPor() != null ? r.getRevisadoPor().getUsuario() : null)
                .fechaSubida(r.getFechaSubida())
                .fechaRevision(r.getFechaRevision())
                .build();
    }
}

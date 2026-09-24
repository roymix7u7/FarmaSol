package com.farmasol.backend.service;

import com.farmasol.backend.dto.receta.ArchivoRecetaDTO;
import com.farmasol.backend.dto.receta.RecetaResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface RecetaService {

    /** El cliente sube (o vuelve a subir) la foto/PDF de receta para una línea de su pedido. */
    RecetaResponse subir(Long idCliente, Long idPedidoDetalle, MultipartFile archivo);

    /** Recetas de un pedido: el propio cliente dueño, o cualquier personal. */
    List<RecetaResponse> listarDePedido(Long idPedido);

    /** Bandeja de revisión para el personal. */
    List<RecetaResponse> listarPendientes();

    RecetaResponse aprobar(Long idPersonal, Long idReceta);

    RecetaResponse rechazar(Long idPersonal, Long idReceta, String motivo);

    /** Devuelve el archivo si quien pide es el cliente dueño del pedido o personal. */
    ArchivoRecetaDTO obtenerArchivo(Long idReceta);
}

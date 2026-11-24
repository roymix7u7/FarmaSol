package com.farmasol.backend.service;

import com.farmasol.backend.dto.receta.ArchivoRecetaDTO;
import com.farmasol.backend.dto.receta.RecetaResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface RecetaService {

    // Agrega esta línea para que la clase impl la reconozca:
    RecetaResponse guardarRecetaTemporal(Long idCliente, Long idProducto, MultipartFile archivo);

    RecetaResponse subir(Long idCliente, Long idPedidoDetalle, MultipartFile archivo);

    List<RecetaResponse> listarDePedido(Long idPedido);

    List<RecetaResponse> listarPendientes();

    RecetaResponse aprobar(Long idPersonal, Long idReceta);

    RecetaResponse rechazar(Long idPersonal, Long idReceta, String motivo);

    ArchivoRecetaDTO obtenerArchivo(Long idReceta);
}
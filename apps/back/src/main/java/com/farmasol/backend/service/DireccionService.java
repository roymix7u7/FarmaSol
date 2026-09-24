package com.farmasol.backend.service;

import com.farmasol.backend.dto.direccion.DireccionRequest;
import com.farmasol.backend.dto.direccion.DireccionResponse;

import java.util.List;

public interface DireccionService {

    List<DireccionResponse> listarDeCliente(Long idCliente);

    DireccionResponse crear(Long idCliente, DireccionRequest request);

    DireccionResponse actualizar(Long idCliente, Long idDireccion, DireccionRequest request);

    void eliminar(Long idCliente, Long idDireccion);

    void marcarPredeterminada(Long idCliente, Long idDireccion);
}

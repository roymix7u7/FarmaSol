package com.farmasol.backend.service;

import com.farmasol.backend.dto.cliente.ClienteResponse;
import com.farmasol.backend.dto.cliente.ClienteUpdateRequest;

import java.util.List;

public interface ClienteService {

    ClienteResponse obtenerPerfil(Long idCliente);

    ClienteResponse actualizarPerfil(Long idCliente, ClienteUpdateRequest request);

    List<ClienteResponse> listar();

    ClienteResponse obtenerPorId(Long id);

    void cambiarEstado(Long id, boolean activo);
}

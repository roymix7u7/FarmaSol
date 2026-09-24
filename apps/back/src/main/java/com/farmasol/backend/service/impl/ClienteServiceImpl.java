package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.cliente.ClienteResponse;
import com.farmasol.backend.dto.cliente.ClienteUpdateRequest;
import com.farmasol.backend.exception.BusinessException;
import com.farmasol.backend.exception.ResourceNotFoundException;
import com.farmasol.backend.model.Cliente;
import com.farmasol.backend.repository.ClienteRepository;
import com.farmasol.backend.service.ClienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteServiceImpl implements ClienteService {

    private final ClienteRepository clienteRepository;

    @Override
    @Transactional(readOnly = true)
    public ClienteResponse obtenerPerfil(Long idCliente) {
        return toResponse(buscar(idCliente));
    }

    @Override
    @Transactional
    public ClienteResponse actualizarPerfil(Long idCliente, ClienteUpdateRequest request) {
        Cliente cliente = buscar(idCliente);
        clienteRepository.findByCorreo(request.getCorreo())
                .filter(c -> !c.getId().equals(idCliente))
                .ifPresent(c -> { throw new BusinessException("El correo ya está registrado"); });

        cliente.setNombres(request.getNombres());
        cliente.setApellidos(request.getApellidos());
        cliente.setCorreo(request.getCorreo());
        cliente.setTelefono(request.getTelefono());
        return toResponse(clienteRepository.save(cliente));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClienteResponse> listar() {
        return clienteRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ClienteResponse obtenerPorId(Long id) {
        return toResponse(buscar(id));
    }

    @Override
    @Transactional
    public void cambiarEstado(Long id, boolean activo) {
        Cliente cliente = buscar(id);
        cliente.setActivo(activo);
        clienteRepository.save(cliente);
    }

    private Cliente buscar(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));
    }

    private ClienteResponse toResponse(Cliente c) {
        return ClienteResponse.builder()
                .id(c.getId())
                .nombres(c.getNombres())
                .apellidos(c.getApellidos())
                .usuario(c.getUsuario())
                .correo(c.getCorreo())
                .dni(c.getDni())
                .telefono(c.getTelefono())
                .activo(c.getActivo())
                .fechaRegistro(c.getFechaRegistro())
                .build();
    }
}

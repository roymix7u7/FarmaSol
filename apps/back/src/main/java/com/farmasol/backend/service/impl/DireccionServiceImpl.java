package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.direccion.DireccionRequest;
import com.farmasol.backend.dto.direccion.DireccionResponse;
import com.farmasol.backend.exception.ResourceNotFoundException;
import com.farmasol.backend.model.Cliente;
import com.farmasol.backend.model.Direccion;
import com.farmasol.backend.repository.ClienteRepository;
import com.farmasol.backend.repository.DireccionRepository;
import com.farmasol.backend.service.DireccionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DireccionServiceImpl implements DireccionService {

    private final DireccionRepository direccionRepository;
    private final ClienteRepository clienteRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DireccionResponse> listarDeCliente(Long idCliente) {
        return direccionRepository.findByCliente_IdAndActivoTrue(idCliente)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public DireccionResponse crear(Long idCliente, DireccionRequest request) {
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        boolean predeterminada = Boolean.TRUE.equals(request.getEsPredeterminada());
        if (predeterminada) {
            desmarcarPredeterminadas(idCliente);
        }

        Direccion direccion = Direccion.builder()
                .cliente(cliente)
                .alias(request.getAlias())
                .direccion(request.getDireccion())
                .distrito(request.getDistrito())
                .ciudad(request.getCiudad())
                .referencia(request.getReferencia())
                .quienRecibe(request.getQuienRecibe())
                .telefonoContacto(request.getTelefonoContacto())
                .esPredeterminada(predeterminada)
                .activo(true)
                .build();

        return toResponse(direccionRepository.save(direccion));
    }

    @Override
    @Transactional
    public DireccionResponse actualizar(Long idCliente, Long idDireccion, DireccionRequest request) {
        Direccion direccion = buscar(idCliente, idDireccion);
        direccion.setAlias(request.getAlias());
        direccion.setDireccion(request.getDireccion());
        direccion.setDistrito(request.getDistrito());
        direccion.setCiudad(request.getCiudad());
        direccion.setReferencia(request.getReferencia());
        direccion.setQuienRecibe(request.getQuienRecibe());
        direccion.setTelefonoContacto(request.getTelefonoContacto());

        if (Boolean.TRUE.equals(request.getEsPredeterminada()) && !direccion.getEsPredeterminada()) {
            desmarcarPredeterminadas(idCliente);
            direccion.setEsPredeterminada(true);
        }
        return toResponse(direccionRepository.save(direccion));
    }

    @Override
    @Transactional
    public void eliminar(Long idCliente, Long idDireccion) {
        Direccion direccion = buscar(idCliente, idDireccion);
        direccion.setActivo(false);
        direccion.setEsPredeterminada(false);
        direccionRepository.save(direccion);
    }

    @Override
    @Transactional
    public void marcarPredeterminada(Long idCliente, Long idDireccion) {
        Direccion direccion = buscar(idCliente, idDireccion);
        desmarcarPredeterminadas(idCliente);
        direccion.setEsPredeterminada(true);
        direccionRepository.save(direccion);
    }

    private void desmarcarPredeterminadas(Long idCliente) {
        List<Direccion> actuales = direccionRepository.findByCliente_IdAndEsPredeterminadaTrue(idCliente);
        actuales.forEach(d -> d.setEsPredeterminada(false));
        direccionRepository.saveAll(actuales);
    }

    private Direccion buscar(Long idCliente, Long idDireccion) {
        return direccionRepository.findByIdAndCliente_Id(idDireccion, idCliente)
                .filter(Direccion::getActivo)
                .orElseThrow(() -> new ResourceNotFoundException("Dirección no encontrada con ID: " + idDireccion));
    }

    private DireccionResponse toResponse(Direccion d) {
        return DireccionResponse.builder()
                .id(d.getId())
                .alias(d.getAlias())
                .direccion(d.getDireccion())
                .distrito(d.getDistrito())
                .ciudad(d.getCiudad())
                .referencia(d.getReferencia())
                .quienRecibe(d.getQuienRecibe())
                .telefonoContacto(d.getTelefonoContacto())
                .esPredeterminada(d.getEsPredeterminada())
                .build();
    }
}

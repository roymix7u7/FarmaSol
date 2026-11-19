package com.farmasol.backend.service.impl;

import com.farmasol.backend.dto.incidencia.IncidenciaRequest;
import com.farmasol.backend.dto.incidencia.IncidenciaResponse;
import com.farmasol.backend.dto.incidencia.ResolverIncidenciaRequest;
import com.farmasol.backend.exception.BusinessException;
import com.farmasol.backend.exception.ResourceNotFoundException;
import com.farmasol.backend.model.Incidencia;
import com.farmasol.backend.model.Personal;
import com.farmasol.backend.model.enums.EstadoIncidencia;
import com.farmasol.backend.repository.IncidenciaRepository;
import com.farmasol.backend.repository.PersonalRepository;
import com.farmasol.backend.security.SecurityUtils;
import com.farmasol.backend.service.IncidenciaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IncidenciaServiceImpl implements IncidenciaService {

    private final IncidenciaRepository incidenciaRepository;
    private final PersonalRepository personalRepository;

    @Override
    @Transactional
    public IncidenciaResponse reportar(IncidenciaRequest request) {
        Incidencia incidencia = Incidencia.builder()
                .tipo(request.getTipo())
                .urgente(Boolean.TRUE.equals(request.getUrgente()))
                .referencia(vacioANull(request.getReferencia()))
                .descripcion(request.getDescripcion().trim())
                .estado(EstadoIncidencia.PENDIENTE)
                .reportadoPor(personalActual())
                .fechaReporte(LocalDateTime.now())
                .build();
        return toResponse(incidenciaRepository.save(incidencia));
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidenciaResponse> misReportes() {
        return incidenciaRepository
                .findByReportadoPorIdOrderByFechaReporteDesc(SecurityUtils.getUidActual())
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidenciaResponse> listar(EstadoIncidencia estado) {
        List<Incidencia> lista = estado == null
                ? incidenciaRepository.findAllByOrderByFechaReporteDesc()
                : incidenciaRepository.findByEstadoOrderByFechaReporteDesc(estado);
        return lista.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public IncidenciaResponse resolver(Long id, ResolverIncidenciaRequest request) {
        Incidencia incidencia = incidenciaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el reporte " + id));
        if (incidencia.getEstado() == EstadoIncidencia.RESUELTA) {
            throw new BusinessException("Este reporte ya fue resuelto");
        }
        incidencia.setEstado(EstadoIncidencia.RESUELTA);
        incidencia.setResueltoPor(personalActual());
        incidencia.setRespuesta(request != null ? vacioANull(request.getRespuesta()) : null);
        incidencia.setFechaResolucion(LocalDateTime.now());
        return toResponse(incidenciaRepository.save(incidencia));
    }

    private Personal personalActual() {
        if (!SecurityUtils.esPersonal()) {
            throw new BusinessException("Solo el personal puede usar los reportes internos");
        }
        Long uid = SecurityUtils.getUidActual();
        return personalRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el usuario " + uid));
    }

    private static String vacioANull(String valor) {
        if (valor == null) return null;
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }

    private static String nombre(Personal p) {
        return p == null ? null : p.getNombres() + " " + p.getApellidos();
    }

    private IncidenciaResponse toResponse(Incidencia i) {
        return IncidenciaResponse.builder()
                .id(i.getId())
                .tipo(i.getTipo())
                .urgente(Boolean.TRUE.equals(i.getUrgente()))
                .referencia(i.getReferencia())
                .descripcion(i.getDescripcion())
                .estado(i.getEstado())
                .reportadoPor(nombre(i.getReportadoPor()))
                .fechaReporte(i.getFechaReporte())
                .resueltoPor(nombre(i.getResueltoPor()))
                .respuesta(i.getRespuesta())
                .fechaResolucion(i.getFechaResolucion())
                .build();
    }
}

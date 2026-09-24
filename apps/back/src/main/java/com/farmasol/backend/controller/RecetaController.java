package com.farmasol.backend.controller;

import com.farmasol.backend.dto.receta.ArchivoRecetaDTO;
import com.farmasol.backend.dto.receta.RechazarRecetaRequest;
import com.farmasol.backend.dto.receta.RecetaResponse;
import com.farmasol.backend.security.SecurityUtils;
import com.farmasol.backend.service.RecetaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RecetaController {

    private final RecetaService recetaService;

    @PostMapping(value = "/api/pedidos/detalles/{idPedidoDetalle}/receta", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<RecetaResponse> subir(@PathVariable Long idPedidoDetalle,
                                                @RequestParam("archivo") MultipartFile archivo) {
        RecetaResponse receta = recetaService.subir(SecurityUtils.getUidActual(), idPedidoDetalle, archivo);
        return new ResponseEntity<>(receta, HttpStatus.CREATED);
    }

    @GetMapping("/api/pedidos/{idPedido}/recetas")
    public ResponseEntity<List<RecetaResponse>> deUnPedido(@PathVariable Long idPedido) {
        return ResponseEntity.ok(recetaService.listarDePedido(idPedido));
    }

    @GetMapping("/api/recetas/pendientes")
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<List<RecetaResponse>> pendientes() {
        return ResponseEntity.ok(recetaService.listarPendientes());
    }

    @GetMapping("/api/recetas/{id}/archivo")
    public ResponseEntity<byte[]> archivo(@PathVariable Long id) {
        ArchivoRecetaDTO archivo = recetaService.obtenerArchivo(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.tipoContenido()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(archivo.nombreArchivo()).build().toString())
                .body(archivo.contenido());
    }

    @PatchMapping("/api/recetas/{id}/aprobar")
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<RecetaResponse> aprobar(@PathVariable Long id) {
        return ResponseEntity.ok(recetaService.aprobar(SecurityUtils.getUidActual(), id));
    }

    @PatchMapping("/api/recetas/{id}/rechazar")
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<RecetaResponse> rechazar(@PathVariable Long id,
                                                   @Valid @RequestBody RechazarRecetaRequest request) {
        return ResponseEntity.ok(recetaService.rechazar(SecurityUtils.getUidActual(), id, request.getMotivo()));
    }
}
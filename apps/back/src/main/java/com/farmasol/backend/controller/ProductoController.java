package com.farmasol.backend.controller;

import com.farmasol.backend.dto.ProductoDTO;
import com.farmasol.backend.dto.producto.ProductoResponse;
import com.farmasol.backend.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public ResponseEntity<List<ProductoResponse>> listar(
            @RequestParam(required = false) String busqueda,
            @RequestParam(required = false) Long idCategoria,
            @RequestParam(defaultValue = "true") boolean incluirSubcategorias,
            @RequestParam(defaultValue = "true") boolean soloActivos) {
        return ResponseEntity.ok(productoService.listar(busqueda, idCategoria, incluirSubcategorias, soloActivos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(productoService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<ProductoResponse> guardar(@Valid @RequestBody ProductoDTO productoDTO) {
        return new ResponseEntity<>(productoService.guardar(productoDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<ProductoResponse> actualizar(@PathVariable Long id,
                                                       @Valid @RequestBody ProductoDTO productoDTO) {
        return ResponseEntity.ok(productoService.actualizar(id, productoDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }




        @PostMapping("/upload-imagen")
    public ResponseEntity<?> subirImagen(@RequestParam("archivo") org.springframework.web.multipart.MultipartFile archivo) {
        if (archivo.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "El archivo está vacío"));
        }

        String nombreOriginal = archivo.getOriginalFilename();
        if (nombreOriginal == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Nombre de archivo inválido"));
        }

        // Limpiamos el nombre
        String nombreLimpio = nombreOriginal.toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9.\\-]", "");

        String baseName = nombreLimpio;
        String extension = "";
        
        if (nombreLimpio.contains(".")) {
            extension = nombreLimpio.substring(nombreLimpio.lastIndexOf("."));
            baseName = nombreLimpio.substring(0, nombreLimpio.lastIndexOf("."));
        }

        // AQUI AGREGAMOS EL .JFIF
        if (!extension.matches("\\.(jpg|jpeg|png|webp|jfif)$")) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Solo se permiten imágenes JPG, JPEG, PNG, WEBP o JFIF."));
        }

        try {
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("../front/public/img/productos");
            
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }

            // LOGICA PARA NOMBRES DUPLICADOS
            String nombreFinal = nombreLimpio;
            java.nio.file.Path rutaCompleta = uploadDir.resolve(nombreFinal);
            int contador = 1;

            // Mientras el archivo exista, le sumamos 1 al contador y probamos con "nombre (1).ext"
            while (java.nio.file.Files.exists(rutaCompleta)) {
                nombreFinal = baseName + " (" + contador + ")" + extension;
                rutaCompleta = uploadDir.resolve(nombreFinal);
                contador++;
            }

            java.nio.file.Files.copy(archivo.getInputStream(), rutaCompleta, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String url = "/img/productos/" + nombreFinal;
            return ResponseEntity.ok(java.util.Map.of("url", url));
            
        } catch (java.io.IOException e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", "Error al guardar la imagen: " + e.getMessage()));
        }
    }



    

        @GetMapping("/imagenes-disponibles")
    public ResponseEntity<?> listarImagenesDisponibles() {
        java.nio.file.Path dir = java.nio.file.Paths.get("../front/public/img/productos");
        java.util.List<String> urls = new java.util.ArrayList<>();
        
        if (java.nio.file.Files.exists(dir)) {
            try (var stream = java.nio.file.Files.list(dir)) {
                stream.filter(java.nio.file.Files::isRegularFile)
                      .map(path -> "/img/productos/" + path.getFileName().toString())
                      .sorted() // Ordenadas alfabéticamente
                      .forEach(urls::add);
            } catch (java.io.IOException e) {
                return ResponseEntity.status(500).body("Error al leer el directorio de imágenes");
            }
        }
        return ResponseEntity.ok(urls);
    }

        @DeleteMapping("/imagenes/{nombreArchivo}")
    public ResponseEntity<?> eliminarImagen(@PathVariable String nombreArchivo) {
        try {
            java.nio.file.Path ruta = java.nio.file.Paths.get("../front/public/img/productos").resolve(nombreArchivo);
            
            // Verificamos que el archivo exista antes de borrarlo
            if (java.nio.file.Files.exists(ruta)) {
                java.nio.file.Files.delete(ruta);
                return ResponseEntity.ok(java.util.Map.of("mensaje", "Imagen eliminada correctamente"));
            }
            return ResponseEntity.status(404).body(java.util.Map.of("error", "La imagen no existe"));
        } catch (java.io.IOException e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", "Error al eliminar la imagen"));
        }
    }
}

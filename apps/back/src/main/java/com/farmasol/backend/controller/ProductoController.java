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

    // ==========================================
    // RUTAS DE IMÁGENES (Van primero para evitar conflictos con /{id})
    // ==========================================

    @GetMapping("/imagenes-disponibles")
    @PreAuthorize("hasAnyRole('GERENTE','EMPLEADO')")
    public ResponseEntity<?> listarImagenesDisponibles() {
        java.util.List<String> urls = new java.util.ArrayList<>();
        try {
            java.nio.file.Path dir = getImagenesPath();
            
            // ESTO ES EL CHIVATO: Nos dirá en la consola dónde está buscando
            System.out.println("==================================================");
            System.out.println("BUSCANDO IMÁGENES EN LA RUTA: " + dir.toString());
            System.out.println("¿LA CARPETA EXISTE?: " + java.nio.file.Files.exists(dir));
            System.out.println("==================================================");

            if (java.nio.file.Files.exists(dir)) {
                try (var stream = java.nio.file.Files.list(dir)) {
                    stream.filter(java.nio.file.Files::isRegularFile)
                          .map(path -> "/img/productos/" + path.getFileName().toString())
                          .sorted()
                          .forEach(urls::add);
                }
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", "Error al leer el directorio: " + e.getMessage()));
        }
        return ResponseEntity.ok(urls);
    }

    @PostMapping("/upload-imagen")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<?> subirImagen(@RequestParam("archivo") org.springframework.web.multipart.MultipartFile archivo) {
        if (archivo.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "El archivo está vacío"));
        }

        String nombreOriginal = archivo.getOriginalFilename();
        if (nombreOriginal == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Nombre de archivo inválido"));
        }

        String nombreLimpio = nombreOriginal.toLowerCase().replaceAll("\\s+", "-").replaceAll("[^a-z0-9.\\-]", "");
        String baseName = nombreLimpio;
        String extension = "";
        
        if (nombreLimpio.contains(".")) {
            extension = nombreLimpio.substring(nombreLimpio.lastIndexOf("."));
            baseName = nombreLimpio.substring(0, nombreLimpio.lastIndexOf("."));
        }

        if (!extension.matches("\\.(jpg|jpeg|png|webp|jfif)$")) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Solo se permiten imágenes JPG, JPEG, PNG, WEBP o JFIF."));
        }

        try {
            java.nio.file.Path uploadDir = getImagenesPath();
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }

            String nombreFinal = nombreLimpio;
            java.nio.file.Path rutaCompleta = uploadDir.resolve(nombreFinal);
            int contador = 1;

            while (java.nio.file.Files.exists(rutaCompleta)) {
                nombreFinal = baseName + " (" + contador + ")" + extension;
                rutaCompleta = uploadDir.resolve(nombreFinal);
                contador++;
            }

            java.nio.file.Files.copy(archivo.getInputStream(), rutaCompleta, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok(java.util.Map.of("url", "/img/productos/" + nombreFinal));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", "Error al guardar la imagen: " + e.getMessage()));
        }
    }

    @DeleteMapping("/imagenes/{nombreArchivo}")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<?> eliminarImagen(@PathVariable String nombreArchivo) {
        try {
            java.nio.file.Path dir = getImagenesPath();
            java.nio.file.Path ruta = dir.resolve(nombreArchivo).normalize();
            
            if (!ruta.getParent().equals(dir)) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "Nombre de archivo inválido"));
            }
            
            if (java.nio.file.Files.exists(ruta)) {
                java.nio.file.Files.delete(ruta);
                return ResponseEntity.ok(java.util.Map.of("mensaje", "Imagen eliminada correctamente"));
            }
            return ResponseEntity.status(404).body(java.util.Map.of("error", "La imagen no existe"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", "Error al eliminar la imagen"));
        }
    }

    // ==========================================
    // RUTAS DEL CRUD DE PRODUCTOS (Van después)
    // ==========================================

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
    public ResponseEntity<ProductoResponse> actualizar(@PathVariable Long id, @Valid @RequestBody ProductoDTO productoDTO) {
        return ResponseEntity.ok(productoService.actualizar(id, productoDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // MÉTODO AUXILIAR PARA RUTAS (A PRUEBA DE BALAS)
    // ==========================================
    private java.nio.file.Path getImagenesPath() {
        String currentDir = System.getProperty("user.dir");
        java.nio.file.Path currentPath = java.nio.file.Paths.get(currentDir);
        
        // 1. Si la terminal o el IDE lo ejecutan desde 'apps/back'
        if (currentDir.endsWith("back") || currentDir.endsWith("back/") || currentDir.endsWith("back\\")) {
            return currentPath.getParent().resolve("front").resolve("public").resolve("img").resolve("productos");
        }
        
        // 2. Si el IDE lo ejecuta desde la raíz 'FarmaSol'
        if (java.nio.file.Files.exists(currentPath.resolve("apps").resolve("front"))) {
            return currentPath.resolve("apps").resolve("front").resolve("public").resolve("img").resolve("productos");
        }
        
        // 3. Si el IDE lo ejecuta desde 'apps'
        if (currentDir.endsWith("apps") || currentDir.endsWith("apps/") || currentDir.endsWith("apps\\")) {
            return currentPath.resolve("front").resolve("public").resolve("img").resolve("productos");
        }
        
        // 4. Respaldo por si acaso
        return java.nio.file.Paths.get("../front/public/img/productos");
    }
}
package com.farmasol.backend.dto.receta;

/** Contenido crudo de un archivo de receta, listo para servir por HTTP. */
public record ArchivoRecetaDTO(byte[] contenido, String tipoContenido, String nombreArchivo) {
}

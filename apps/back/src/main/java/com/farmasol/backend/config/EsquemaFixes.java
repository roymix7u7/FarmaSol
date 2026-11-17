package com.farmasol.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Corrige columnas que {@code ddl-auto=update} no sabe cambiar: Hibernate agrega
 * columnas nuevas, pero nunca vuelve opcional una que ya existía como NOT NULL.
 *
 * <p>Caso actual: la receta se sube desde el carrito, antes de que exista el
 * pedido, así que {@code recetas.id_pedido_detalle} tiene que aceptar NULL. Las
 * bases creadas antes de ese cambio la tenían obligatoria y rechazaban la subida
 * con un 409 ("La operación viola una restricción de datos").
 *
 * <p>Cada corrección revisa primero el esquema, así que correrla en una base ya
 * correcta no hace nada.
 */
@Component
@Profile("!test")
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class EsquemaFixes implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(String... args) {
        volverOpcional("recetas", "id_pedido_detalle", "BIGINT");
    }

    private void volverOpcional(String tabla, String columna, String tipo) {
        Integer obligatoria = jdbc.queryForObject("""
                SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
                  AND IS_NULLABLE = 'NO'
                """, Integer.class, tabla, columna);
        if (obligatoria == null || obligatoria == 0) return;

        jdbc.execute("ALTER TABLE " + tabla + " MODIFY " + columna + " " + tipo + " NULL");
        log.info("Esquema: {}.{} ahora acepta NULL", tabla, columna);
    }
}

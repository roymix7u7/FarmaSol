package com.farmasol.backend.config;

import com.farmasol.backend.model.*;
import com.farmasol.backend.model.enums.RolPersonal;
import com.farmasol.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final PersonalRepository personalRepository;
    private final ClienteRepository clienteRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final PromocionRepository promocionRepository;
    private final SedeRepository sedeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedPersonal();
        seedSedes();
        seedCatalogo();
        seedClienteDemo();
    }

    private void seedSedes() {
        if (sedeRepository.count() > 0) return;
        sedeRepository.save(Sede.builder().nombre("Sede Surco")
                .direccion("Av. Camino del Inca 1240").distrito("Santiago de Surco")
                .horario("Lun a Sáb 8:00 - 22:00").activo(true).build());
        sedeRepository.save(Sede.builder().nombre("Sede Miraflores")
                .direccion("Av. Larco 345").distrito("Miraflores")
                .horario("Lun a Dom 7:00 - 23:00").activo(true).build());
        sedeRepository.save(Sede.builder().nombre("Sede San Isidro")
                .direccion("Av. Javier Prado Este 492").distrito("San Isidro")
                .horario("Lun a Sáb 8:00 - 21:00").activo(true).build());
        log.info("Seed: 3 sedes creadas");
    }

    private void seedPersonal() {
        if (personalRepository.count() > 0) return;
        Personal gerente = personalRepository.save(Personal.builder()
                .nombres("Gerente").apellidos("General")
                .usuario("gerente").correo("gerente@farmasol.pe")
                .passwordHash(passwordEncoder.encode("Gerente123!"))
                .rol(RolPersonal.GERENTE).activo(true)
                .build());

        personalRepository.save(Personal.builder()
                .nombres("Empleado").apellidos("Basico")
                .usuario("empleado").correo("empleado@farmasol.pe")
                .passwordHash(passwordEncoder.encode("Empleado123!"))
                .rol(RolPersonal.EMPLEADO).creadoPor(gerente).activo(true)
                .build());
        log.info("Seed: personal creado (gerente / empleado)");
    }

    /**
     * Catálogo de ejemplo, leído de {@code resources/productos.csv}.
     *
     * <p>Corre en cada arranque y solo agrega lo que falta: así una base creada
     * antes (con el catálogo viejo) también recibe los productos nuevos sin tener
     * que borrarla. Los productos del catálogo anterior se reconocen por su foto y
     * se ponen al día conservando su id y su stock, para no romper pedidos ni
     * ventas. Lo que alguien editó a mano no se toca.
     */
    private void seedCatalogo() {
        // 1. CATEGORÍAS (se crean solo si no existen)
        Categoria farmacia = cat("Farmacia", "farmacia", null, 1);
        Categoria mamaBebe = cat("Mamá y Bebé", "mama-y-bebe", null, 4);
        cat("Galénicos", "galenicos", null, 2);
        cat("Dermocosmético", "dermocosmetico", null, 3);
        cat("Adulto Mayor", "adulto-mayor", null, 5);
        cat("Cosméticos", "cosmeticos", null, 6);
        cat("Dispositivos Médicos", "dispositivos-medicos", null, 7);

        cat("Analgésicos", "analgesicos", farmacia, 1);
        cat("Antigripales", "antigripales", farmacia, 2);
        cat("Antibióticos", "antibioticos", farmacia, 3);
        cat("Nutrición", "nutricion", farmacia, 4);
        cat("Botiquín", "botiquin", farmacia, 5);
        cat("Antiinflamatorios", "antiinflamatorio", farmacia, 6);
        cat("Antimicóticos", "antimicotico", farmacia, 7);
        cat("Betabloqueantes", "betabloqueantes", farmacia, 8);
        cat("Antifúngicos", "antifungico", farmacia, 9);
        cat("Pañales", "panales", mamaBebe, 1);

        // 2. PRODUCTOS QUE YA ESTÁN, por su foto: así se reconocen los del catálogo
        // anterior aunque en el CSV tengan otro nombre.
        Map<String, Producto> porFoto = new HashMap<>();
        for (Producto p : productoRepository.findAll()) {
            if (p.getImagenUrl() != null) {
                porFoto.putIfAbsent(claveFoto(p.getImagenUrl()), p);
            } else if (FOTO_DEL_CATALOGO_MAS_VIEJO.containsKey(p.getNombre())) {
                porFoto.putIfAbsent(claveFoto(FOTO_DEL_CATALOGO_MAS_VIEJO.get(p.getNombre())), p);
            }
        }

        // 3. EL CSV
        int creados = 0;
        int actualizados = 0;
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                getClass().getResourceAsStream("/productos.csv"), StandardCharsets.UTF_8))) {

            // El separador sale de la cabecera (Excel guarda con ";" o ","). Partir
            // por cualquiera de los tres rompía las filas con una coma en el nombre.
            String cabecera = br.readLine().replace("\uFEFF", "");
            String separador = cabecera.contains(";") ? ";" : cabecera.contains("\t") ? "\t" : ",";

            String linea;
            int numero = 1;
            while ((linea = br.readLine()) != null) {
                numero++;
                if (linea.isBlank()) continue;
                String[] d = linea.split(separador, -1);
                // Una fila mal escrita se avisa y se salta, sin perder el resto.
                if (d.length < 9) {
                    log.warn("productos.csv fila {}: tiene {} columnas y se esperaban 9, se omite", numero, d.length);
                    continue;
                }
                try {
                    String nombre = d[0].trim();
                    if (productoRepository.existsByNombre(nombre)) continue;

                    String slug = d[1].trim().toLowerCase();
                    Categoria categoria = categoriaRepository.findBySlug(slug).orElse(null);
                    if (categoria == null) {
                        log.warn("productos.csv fila {}: la categoría '{}' no existe, va a Farmacia", numero, slug);
                        categoria = farmacia;
                    }
                    String presentacion = d[5].trim();
                    String imagenUrl = d[7].trim();
                    String registro = d[8].trim();

                    Producto anterior = porFoto.get(claveFoto(imagenUrl));
                    boolean ponerAlDia = anterior != null && sinEditar(anterior);
                    Producto p = ponerAlDia ? anterior
                            : Producto.builder().stock(Integer.parseInt(d[3].trim())).activo(true).build();
                    p.setNombre(nombre);
                    p.setDescripcion(nombre + " - " + presentacion);
                    p.setPrecio(new BigDecimal(d[2].trim()));
                    p.setCategoria(categoria);
                    p.setMarca(d[4].trim());
                    p.setPresentacion(presentacion);
                    p.setRequiereReceta(Boolean.parseBoolean(d[6].trim()));
                    p.setImagenUrl(imagenUrl);
                    p.setRegistroSanitario(registro.isEmpty() ? "N/A" : registro);
                    productoRepository.save(p);
                    if (ponerAlDia) {
                        porFoto.remove(claveFoto(imagenUrl));
                        actualizados++;
                    } else {
                        creados++;
                    }
                } catch (RuntimeException e) {
                    log.warn("productos.csv fila {}: {} — se omite", numero, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("No se pudo leer productos.csv: {}", e.getMessage());
        }

        log.info("Seed: catálogo al día ({} nuevos, {} actualizados, {} productos en total)",
                creados, actualizados, productoRepository.count());
    }

    /**
     * Los 8 productos del primer catálogo no tenían foto: esta es la que les toca,
     * para reconocerlos en las bases que todavía los tienen así.
     */
    private static final Map<String, String> FOTO_DEL_CATALOGO_MAS_VIEJO = Map.of(
            "Paracetamol 500 mg", "Paracetamol-500mg-Via-Oral-Tabletas-100.webp",
            "Ibuprofeno 400 mg", "actron-ibuprofeno-400mg-Capsulax1.webp",
            "Pregabalina 75 mg", "Pregabalina-75mg-Capsulas-30.webp",
            "Antigripal Forte", "Panadol-Antigripal-NF-52SOB-2TABS.jpg",
            "Diutin Fibercel Fibra Soluble", "diutin-FIBERCEL-FIBRA-SOLUBLE-336g.webp",
            "Protector Solar FPS 50", "alma-secret-crema-solar-facial-spf50-50-ml.jpg",
            "Pañales Talla M x40", "HUGGIES-Natural-Care-M2-Pañalesx60.jpg",
            "Multivitamínico Adulto Mayor", "Centrum-ADULTO-Comprimidosx30-400mg.jpg");

    /** Nombre del archivo sin carpeta, en minúsculas y sin "°" (se quitó al renombrar las fotos). */
    private static String claveFoto(String url) {
        return url.substring(url.lastIndexOf('/') + 1).toLowerCase().replace("°", "");
    }

    /**
     * El catálogo siempre arma la descripción como "nombre - presentación". Si
     * sigue así, el producto es el de ejemplo tal cual; si no, alguien lo editó
     * desde el panel y se respeta.
     */
    private static boolean sinEditar(Producto p) {
        return (p.getNombre() + " - " + p.getPresentacion()).equals(p.getDescripcion());
    }

    private void seedClienteDemo() {
        if (clienteRepository.count() > 0) return;
        clienteRepository.save(Cliente.builder()
                .nombres("Cliente").apellidos("Demo")
                .usuario("cliente@demo.pe").correo("cliente@demo.pe")
                .dni("70000001")
                .passwordHash(passwordEncoder.encode("Cliente123!"))
                .telefono("987654321").activo(true)
                .build());
        log.info("Seed: cliente demo creado (cliente@demo.pe / Cliente123!)");
    }

    /** Devuelve la categoría con ese slug, creándola si no existe. */
    private Categoria cat(String nombre, String slug, Categoria padre, int orden) {
        return categoriaRepository.findBySlug(slug).orElseGet(() -> categoriaRepository.save(Categoria.builder()
                .nombre(nombre).slug(slug).categoriaPadre(padre).orden(orden).activo(true)
                .build()));
    }
}

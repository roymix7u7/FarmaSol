package com.farmasol.backend.config;

import com.farmasol.backend.model.*;
import com.farmasol.backend.model.enums.RolPersonal;
import com.farmasol.backend.model.enums.TipoDescuento;
import com.farmasol.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;

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
     * Catálogo de ejemplo. Corre en cada arranque y solo agrega lo que falta, así
     * que una base creada con una versión anterior también recibe los productos
     * nuevos sin tener que borrarla. Nunca cambia lo que alguien ya editó.
     */
    private void seedCatalogo() {
        // CATEGORÍAS PRINCIPALES
        Categoria farmacia = cat("Farmacia", "farmacia", null, 1);
        Categoria galenicos = cat("Galénicos", "galenicos", null, 2);
        Categoria dermo = cat("Dermocosmético", "dermocosmetico", null, 3);
        Categoria mamaBebe = cat("Mamá y Bebé", "mama-y-bebe", null, 4);
        cat("Adulto Mayor", "adulto-mayor", null, 5);

        // SUBCATEGORÍAS
        Categoria analgesicos = cat("Analgésicos", "analgesicos", farmacia, 1);
        Categoria antigripales = cat("Antigripales", "antigripales", farmacia, 2);
        Categoria antibioticos = cat("Antibióticos", "antibioticos", farmacia, 3);
        Categoria nutricion = cat("Nutrición", "nutricion", farmacia, 4);
        Categoria botiquin = cat("Botiquín", "botiquin", farmacia, 5);
        Categoria panales = cat("Pañales", "panales", mamaBebe, 1);

        // PRODUCTOS. El último dato, cuando lo hay, es el nombre que tenía en el
        // catálogo anterior (sin foto): si la base lo tiene, se actualiza ese
        // mismo producto en vez de crear uno repetido.

        // --- Analgésicos ---
        prod("Paracetamol 500mg Vía Oral Tabletas x100", analgesicos, "12.50", 120, "Genfar", "Caja 100 tab", false, "/img/productos/Paracetamol-500mg-Via-Oral-Tabletas-100.webp", "Paracetamol 500 mg");
        prod("Actron Ibuprofeno 400mg Cápsula x1", analgesicos, "8.90", 45, "Bayer", "Cápsulas x1", false, "/img/productos/actron-ibuprofeno-400mg-Capsulax1.webp", "Ibuprofeno 400 mg");
        prod("Pregabalina 75mg Cápsulas x30", analgesicos, "22.00", 30, "Farmindustria", "Caja 30 caps", true, "/img/productos/Pregabalina-75mg-Capsulas-30.webp", "Pregabalina 75 mg");

        // --- Antigripales ---
        prod("Panadol Antigripal NF Sobres x2", antigripales, "18.00", 50, "GSK", "Sobres x2 tab", false, "/img/productos/Panadol-Antigripal-NF-52SOB-2TABS.jpg", "Antigripal Forte");

        // --- Antibióticos (AGOTADO) ---
        prod("Amoxicilina Polvo para Solución Oral 60mL", antibioticos, "15.00", 0, "Genfar", "Polvo susp. 60ml", true, "/img/productos/AMOXICILINA-Polvo-para-solucion-oral-60mL.jpg", null);

        // --- Nutrición ---
        prod("Diutin Fibercel Fibra Soluble 336g", nutricion, "67.98", 25, "Diutin", "Lata 336 g", false, "/img/productos/diutin-FIBERCEL-FIBRA-SOLUBLE-336g.webp", "Diutin Fibercel Fibra Soluble");
        prod("Centrum Adulto Comprimidos x30", nutricion, "45.00", 15, "Centrum", "Frasco 30 tab", false, "/img/productos/Centrum-ADULTO-Comprimidosx30-400mg.jpg", "Multivitamínico Adulto Mayor");

        // --- Botiquín ---
        prod("Alcohol 70° Gel 100mL", botiquin, "5.50", 60, "FarmaSol", "Frasco 100ml", false, "/img/productos/Alcohol-70°-GEL-100mL.png", null);
        prod("Alcohol Medicinal 70° Solución Uso Externo 1000mL", botiquin, "12.00", 25, "FarmaSol", "Frasco 1000ml", false, "/img/productos/Alcohol-Medicinal-70°-Solucion-Uso-Externo-1000mL.png", null);
        prod("Alcohol Medicinal 70° Spray 1000mL", botiquin, "15.00", 20, "FarmaSol", "Spray 1000ml", false, "/img/productos/Alcohol-Medicinal-70°-Solucion-Uso-Externo-1000mL-Spray.png", null);
        prod("Alcohol Yodado Solución Uso Externo 120mL", botiquin, "7.50", 45, "FarmaSol", "Frasco 120ml", false, "/img/productos/Alcohol-Yodado-Solucion-Uso-Externo-120mL.png", null);
        prod("Agua Oxigenada 500mL", botiquin, "4.50", 35, "FarmaSol", "Frasco 500ml", false, "/img/productos/Agua_Oxigenada_500mL.png", null);
        prod("Glicerina Solución 1000mL", botiquin, "14.00", 15, "FarmaSol", "Frasco 1000ml", false, "/img/productos/Glicerina-Solucion-1000mL.png", null);
        prod("Tintura de Árnica Solución Uso Externo 1000mL", botiquin, "20.00", 10, "FarmaSol", "Frasco 1000ml", false, "/img/productos/Tintura-de-Arnica-Solucion-Uso-Externo-1000mL.png", null);
        prod("Tintura de Yodo Solución Uso Externo 1000mL", botiquin, "18.00", 12, "FarmaSol", "Frasco 1000ml", false, "/img/productos/Tintura-de-Yodo-Solucion-Uso-Externo-1000mL.png", null);
        prod("Vinagre Bully Solución Uso Externo 240mL", botiquin, "9.00", 30, "Bully", "Frasco 240ml", false, "/img/productos/Vinagre-Bully-Solucion-Uso-Externo-240mL.png", null);
        prod("Mascarilla Quirúrgica x50", botiquin, "15.00", 100, "FarmaSol", "Caja x50", false, "/img/productos/img0355.webp", null);

        // --- Galénicos (POR AGOTAR) ---
        prod("Nitrato de Plata 12 Lápices Uso Tópico", galenicos, "25.00", 12, "FarmaSol", "Lápices x12", true, "/img/productos/NITRATO-DE-PLATA_12-LAPICES-USO-TOPICO.png", null);
        prod("Violeta de Genciana 1% Solución Tópico Uso Externo 30mL", galenicos, "8.00", 20, "FarmaSol", "Frasco 30ml", false, "/img/productos/Violeta-de-Genciana-1-Solucion-Topico-Uso-Externo-30mL.webp", null);
        prod("Timol Compuesto 75mL", galenicos, "15.00", 5, "FarmaSol", "Frasco 75ml", false, "/img/productos/Timol-Compuesto-75mL.png", null);
        prod("Elixir Estomacal Solución Oral 30mL", galenicos, "12.00", 30, "FarmaSol", "Frasco 30ml", false, "/img/productos/Elixir-Estomacal-Solucion-Oral-30mL.png", null);
        prod("Agua de Azahar Solución Oral 500mL", galenicos, "10.00", 15, "FarmaSol", "Frasco 500ml", false, "/img/productos/Agua-de-Azahar-Solucion-Oral-500mL.png", null);
        prod("Bicarbonato de Sodio Polvo para Solución Oral 1000g", galenicos, "18.00", 40, "FarmaSol", "Bolsa 1000g", false, "/img/productos/Bicarbonato-de-Sodio-Polvo-para-Solucion-Oral-1000g.png", null);

        // --- Dermocosmético ---
        prod("Alma Secret Crema Solar Facial SPF50 50mL", dermo, "45.00", 40, "Alma Secret", "Frasco 60 ml", false, "/img/productos/alma-secret-crema-solar-facial-spf50-50-ml.jpg", "Protector Solar FPS 50");
        prod("Skin Repair Crema 75mL", dermo, "38.00", 22, "FarmaSol", "Frasco 75ml", false, "/img/productos/SKIN-REPAIR-CREMA-75mL.webp", null);
        prod("Aceite de Almendras 30ml", dermo, "16.00", 18, "FarmaSol", "Frasco 30ml", false, "/img/productos/Aceite-de-Almendras-30ml.png", null);
        prod("Aceite de Ricino 30ml", dermo, "18.00", 15, "FarmaSol", "Frasco 30 ml", false, "/img/productos/aceite-de-ricino-30-ml-1024x1024.png", null);
        prod("Aceite Rosado 30ml", dermo, "18.00", 15, "FarmaSol", "Frasco 30 ml", false, "/img/productos/aceite-rosado-30-ml-1024x1024.png", null);

        // --- Mamá y Bebé ---
        prod("Huggies Natural Care M2 Pañales x60", panales, "38.90", 50, "Huggies", "Paquete x60", false, "/img/productos/HUGGIES-Natural-Care-M2-Pañalesx60.jpg", "Pañales Talla M x40");

        // PROMOCIÓN DE PRUEBA
        if (promocionRepository.count() == 0) {
            promocionRepository.save(Promocion.builder()
                    .titulo("Campaña Invierno - 15% dto.")
                    .descripcion("Descuento en productos seleccionados de Farmacia")
                    .tipoDescuento(TipoDescuento.PORCENTAJE)
                    .valorDescuento(new BigDecimal("15.00"))
                    .fechaInicio(LocalDate.now().minusDays(1))
                    .fechaFin(LocalDate.now().plusMonths(1))
                    .imagenBanner("/banners/invierno.jpg")
                    .mostrarEnCarrusel(true).orden(1).activo(true)
                    .categorias(Set.of(farmacia))
                    .build());
        }

        log.info("Seed: catálogo al día ({} categorías, {} productos)",
                categoriaRepository.count(), productoRepository.count());
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

    /**
     * Crea el producto si no existe. Si la base tiene su versión del catálogo
     * anterior ({@code nombreAnterior}) y nadie le puso foto, la pone al día
     * conservando su id y su stock, para no romper los pedidos y ventas que ya
     * la usan.
     */
    private void prod(String nombre, Categoria categoria, String precio, int stock, String marca,
                      String presentacion, boolean requiereReceta, String imagenUrl, String nombreAnterior) {
        if (productoRepository.existsByNombre(nombre)) {
            return;
        }
        Producto producto = Optional.ofNullable(nombreAnterior)
                .flatMap(productoRepository::findFirstByNombre)
                .filter(p -> p.getImagenUrl() == null)
                .orElseGet(() -> Producto.builder().stock(stock).activo(true).build());
        producto.setNombre(nombre);
        producto.setDescripcion(nombre + " - " + presentacion);
        producto.setPrecio(new BigDecimal(precio));
        producto.setCategoria(categoria);
        producto.setMarca(marca);
        producto.setPresentacion(presentacion);
        producto.setRequiereReceta(requiereReceta);
        producto.setImagenUrl(imagenUrl);
        productoRepository.save(producto);
    }
}

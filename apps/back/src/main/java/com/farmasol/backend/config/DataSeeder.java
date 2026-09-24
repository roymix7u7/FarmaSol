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
import java.util.List;
import java.util.Set;

/**
 * Carga datos iniciales la primera vez que arranca contra una base vacía.
 * Cada bloque es idempotente (solo corre si su tabla está vacía).
 */
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
        if (sedeRepository.count() > 0) {
            return;
        }
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
        if (personalRepository.count() > 0) {
            return;
        }
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

    private void seedCatalogo() {
        if (categoriaRepository.count() > 0) {
            return;
        }
        Categoria farmacia = cat("Farmacia", "farmacia", null, 1);
        Categoria adultoMayor = cat("Adulto Mayor", "adulto-mayor", null, 2);
        Categoria mamaBebe = cat("Mamá y Bebé", "mama-y-bebe", null, 3);
        Categoria dermo = cat("Dermocosmético", "dermocosmetico", null, 4);

        Categoria analgesicos = cat("Analgésicos", "analgesicos", farmacia, 1);
        Categoria antigripales = cat("Antigripales", "antigripales", farmacia, 2);
        Categoria nutricion = cat("Nutrición", "nutricion", farmacia, 3);
        Categoria panales = cat("Pañales", "panales", mamaBebe, 1);

        Producto p1 = prod("Paracetamol 500 mg", analgesicos, "8.90", 120, "Genfar", "Caja 20 tab", false);
        Producto p2 = prod("Ibuprofeno 400 mg", analgesicos, "12.50", 80, "Bayer", "Caja 10 tab", false);
        Producto p3 = prod("Pregabalina 75 mg", analgesicos, "22.00", 30, "Farmindustria", "Caja 30 caps", true);
        Producto p4 = prod("Antigripal Forte", antigripales, "15.00", 60, "Panadol", "Caja 12 sob", false);
        Producto p5 = prod("Diutin Fibercel Fibra Soluble", nutricion, "67.98", 25, "Diutin", "Lata 336 g", false);
        prod("Protector Solar FPS 50", dermo, "45.00", 40, "Alma Secret", "Frasco 60 ml", false);
        prod("Pañales Talla M x40", panales, "38.90", 50, "Huggies", "Paquete x40", false);
        prod("Multivitamínico Adulto Mayor", adultoMayor, "29.90", 35, "Centrum", "Frasco 30 tab", false);

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
                .productos(Set.of(p5))
                .build());

        log.info("Seed: catálogo creado ({} categorías, {} productos, 1 promoción)",
                categoriaRepository.count(), productoRepository.count());
    }

    private void seedClienteDemo() {
        if (clienteRepository.count() > 0) {
            return;
        }
        clienteRepository.save(Cliente.builder()
                .nombres("Cliente").apellidos("Demo")
                .usuario("cliente").correo("cliente@demo.pe")
                .dni("70000001")
                .passwordHash(passwordEncoder.encode("Cliente123!"))
                .telefono("987654321").activo(true)
                .build());
        log.info("Seed: cliente demo creado (cliente / Cliente123!)");
    }

    private Categoria cat(String nombre, String slug, Categoria padre, int orden) {
        return categoriaRepository.save(Categoria.builder()
                .nombre(nombre).slug(slug).categoriaPadre(padre).orden(orden).activo(true)
                .build());
    }

    private Producto prod(String nombre, Categoria categoria, String precio, int stock,
                          String marca, String presentacion, boolean requiereReceta) {
        return productoRepository.save(Producto.builder()
                .nombre(nombre)
                .descripcion(nombre + " - " + presentacion)
                .precio(new BigDecimal(precio))
                .stock(stock)
                .categoria(categoria)
                .marca(marca)
                .presentacion(presentacion)
                .requiereReceta(requiereReceta)
                .activo(true)
                .build());
    }
}

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

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
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

    


        private void seedCatalogo() {
        if (categoriaRepository.count() > 0) return;

        // 1. CREAMOS LAS CATEGORÍAS (Agregando las de tu Excel)
        Categoria farmacia = cat("Farmacia", "farmacia", null, 1);
        Categoria galenicos = cat("Galénicos", "galenicos", null, 2);
        Categoria dermo = cat("Dermocosmético", "dermocosmetico", null, 3);
        Categoria mamaBebe = cat("Mamá y Bebé", "mama-y-bebe", null, 4);
        Categoria adultoMayor = cat("Adulto Mayor", "adulto-mayor", null, 5);
        
        // NUEVAS CATEGORÍAS DE TU EXCEL
        Categoria cosmeticos = cat("Cosméticos", "cosmeticos", null, 6);
        Categoria dispositivos = cat("Dispositivos Médicos", "dispositivos-medicos", null, 7);

        // SUBCATEGORÍAS (Las que teníamos antes)
        Categoria analgesicos = cat("Analgésicos", "analgesicos", farmacia, 1);
        Categoria antigripales = cat("Antigripales", "antigripales", farmacia, 2);
        Categoria antibioticos = cat("Antibióticos", "antibioticos", farmacia, 3);
        Categoria nutricion = cat("Nutrición", "nutricion", farmacia, 4);
        Categoria botiquin = cat("Botiquín", "botiquin", farmacia, 5);
        Categoria panales = cat("Pañales", "panales", mamaBebe, 1); 
        Categoria antiinflamatorio = cat("Antiinflamatorios", "antiinflamatorio", farmacia, 6);
        Categoria antimicotico = cat("Antimicóticos", "antimicotico", farmacia, 7);
        Categoria betabloqueantes = cat("Betabloqueantes", "betabloqueantes", farmacia, 8);
        Categoria antifungico = cat("Antifúngicos", "antifungico", farmacia, 9);

        // 2. MAPA DE CATEGORÍAS (Conecta el Excel con Java)
        Map<String, Categoria> mapaCategorias = new HashMap<>();
        mapaCategorias.put("farmacia", farmacia);
        mapaCategorias.put("galenicos", galenicos);
        mapaCategorias.put("dermocosmetico", dermo);
        mapaCategorias.put("mama-y-bebe", mamaBebe);
        mapaCategorias.put("adulto-mayor", adultoMayor);
        mapaCategorias.put("cosmeticos", cosmeticos);
        mapaCategorias.put("dispositivos-medicos", dispositivos);
        
        mapaCategorias.put("analgesicos", analgesicos);
        mapaCategorias.put("antigripales", antigripales);
        mapaCategorias.put("antibioticos", antibioticos);
        mapaCategorias.put("nutricion", nutricion);
        mapaCategorias.put("botiquin", botiquin);
        mapaCategorias.put("panales", panales);
        mapaCategorias.put("antiinflamatorio", antiinflamatorio);
        mapaCategorias.put("antimicotico", antimicotico);
        mapaCategorias.put("betabloqueantes", betabloqueantes);
        mapaCategorias.put("antifungico", antifungico);

        // 3. LEEMOS EL CSV
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                getClass().getResourceAsStream("/productos.csv"), StandardCharsets.UTF_8))) {
            
            String linea;
            boolean primeraLinea = true;
            int contador = 0;

            while ((linea = br.readLine()) != null) {
                if (primeraLinea) {
                    primeraLinea = false;
                    continue;
                }

                // Acepta comas, punto y coma o tabulaciones
                String[] datos = linea.split("[;\\t,]", -1); 
                
                if (datos.length >= 9) {
                    String nombre = datos[0].trim();
                    String catSlug = datos[1].trim().toLowerCase();
                    BigDecimal precio = new BigDecimal(datos[2].trim());
                    int stock = Integer.parseInt(datos[3].trim());
                    String marca = datos[4].trim();
                    String presentacion = datos[5].trim();
                    boolean requiereReceta = Boolean.parseBoolean(datos[6].trim());
                    String imagenUrl = datos[7].trim();
                    String registroSanitario = datos[8].trim();

                    Categoria catAsignada = mapaCategorias.getOrDefault(catSlug, farmacia);

                    productoRepository.save(Producto.builder()
                            .nombre(nombre)
                            .descripcion(nombre + " - " + presentacion)
                            .precio(precio)
                            .stock(stock)
                            .categoria(catAsignada)
                            .marca(marca)
                            .presentacion(presentacion)
                            .requiereReceta(requiereReceta)
                            .imagenUrl(imagenUrl)
                            .registroSanitario(registroSanitario.isEmpty() ? "N/A" : registroSanitario)
                            .activo(true)
                            .build());
                    contador++;
                }
            }
            log.info("Seed: Catálogo cargado desde CSV. {} productos creados.", contador);

        } catch (Exception e) {
            log.error("Error al leer productos.csv: " + e.getMessage());
        }
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

    private Categoria cat(String nombre, String slug, Categoria padre, int orden) {
        return categoriaRepository.save(Categoria.builder()
                .nombre(nombre).slug(slug).categoriaPadre(padre).orden(orden).activo(true)
                .build());
    }
}
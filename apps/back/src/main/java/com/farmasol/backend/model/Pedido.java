package com.farmasol.backend.model;

import com.farmasol.backend.model.enums.EstadoPedido;
import com.farmasol.backend.model.enums.TipoEntrega;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedidos", uniqueConstraints = @UniqueConstraint(name = "uq_pedidos_codigo", columnNames = "codigo_pedido"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido")
    private Long id;

    @Column(name = "codigo_pedido", length = 20)
    private String codigoPedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_direccion")
    private Direccion direccion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atendido_por")
    private Personal atendidoPor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoPedido estado = EstadoPedido.PENDIENTE;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_entrega", nullable = false, length = 20)
    @Builder.Default
    private TipoEntrega tipoEntrega = TipoEntrega.DELIVERY;

    /** true si contiene algún producto que requiere receta médica (bloquea CONFIRMADO hasta aprobarla). */
    @Column(name = "requiere_receta", nullable = false)
    @Builder.Default
    private Boolean requiereReceta = false;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "descuento_total", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal descuentoTotal = BigDecimal.ZERO;

    @Column(name = "costo_envio", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal costoEnvio = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    // --- Datos de envío a domicilio (DELIVERY) ---
    @Column(name = "envio_quien_recibe", length = 120)
    private String envioQuienRecibe;

    @Column(name = "envio_telefono", length = 20)
    private String envioTelefono;

    @Column(name = "envio_direccion", length = 255)
    private String envioDireccion;

    @Column(name = "envio_distrito", length = 100)
    private String envioDistrito;

    @Column(name = "envio_referencia", length = 255)
    private String envioReferencia;

    // --- Datos de retiro en botica (RECOJO_TIENDA) ---
    @Column(name = "recojo_sede", length = 150)
    private String recojoSede;

    @Column(name = "recojo_nombre", length = 120)
    private String recojoNombre;

    @Column(name = "recojo_dni", length = 20)
    private String recojoDni;

    @Column(name = "fecha_pedido", nullable = false, updatable = false)
    private LocalDateTime fechaPedido;

    @Column(name = "fecha_confirmacion")
    private LocalDateTime fechaConfirmacion;

    @Column(name = "fecha_entrega")
    private LocalDateTime fechaEntrega;

    @Column(length = 255)
    private String notas;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PedidoDetalle> detalles = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.fechaPedido = LocalDateTime.now();
    }
}

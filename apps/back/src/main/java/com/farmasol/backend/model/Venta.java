package com.farmasol.backend.model;

import com.farmasol.backend.model.enums.MarcaTarjeta;
import com.farmasol.backend.model.enums.MetodoPago;
import com.farmasol.backend.model.enums.TipoDocumento;
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

/**
 * Venta presencial, cobrada en el mostrador por el personal.
 *
 * <p>Va en su propia tabla y no en "pedidos" porque ahí el cliente es
 * obligatorio, y una venta de mostrador casi nunca tiene cliente registrado:
 * relajar esa columna exigiría una migración que ddl-auto no hace.
 *
 * <p>Una venta nunca se borra: si hay un error se anula, devolviendo el stock y
 * dejando registrado quién, cuándo y por qué.
 */
@Entity
@Table(name = "ventas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_venta")
    private Long id;

    @Column(name = "codigo_venta", length = 20)
    private String codigoVenta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendido_por", nullable = false)
    private Personal vendidoPor;

    // --- Comprador (opcional; obligatorio por encima de S/ 700, ver VentaServiceImpl)
    @Enumerated(EnumType.STRING)
    @Column(name = "cliente_tipo_documento", length = 25)
    private TipoDocumento clienteTipoDocumento;

    @Column(name = "cliente_documento", length = 20)
    private String clienteDocumento;

    @Column(name = "cliente_nombre", length = 120)
    private String clienteNombre;

    // --- Importes
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "descuento_total", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal descuentoTotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    // --- Pago
    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago", nullable = false, length = 15)
    private MetodoPago metodoPago;

    /** Lo que entregó el cliente. Solo en efectivo; en el resto es igual al total. */
    @Column(name = "monto_recibido", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoRecibido;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal vuelto = BigDecimal.ZERO;

    /** Número de operación de Yape o del voucher del POS. Nunca el número de la tarjeta. */
    @Column(name = "codigo_operacion", length = 20)
    private String codigoOperacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tarjeta_marca", length = 15)
    private MarcaTarjeta tarjetaMarca;

    /** Solo los 4 últimos dígitos: guardar el número completo violaría PCI DSS. */
    @Column(name = "tarjeta_ultimos4", length = 4)
    private String tarjetaUltimos4;

    @Column(name = "fecha_venta", nullable = false, updatable = false)
    private LocalDateTime fechaVenta;

    // --- Anulación
    @Column(nullable = false)
    @Builder.Default
    private Boolean anulada = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anulada_por")
    private Personal anuladaPor;

    @Column(name = "fecha_anulacion")
    private LocalDateTime fechaAnulacion;

    @Column(name = "motivo_anulacion", length = 255)
    private String motivoAnulacion;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VentaDetalle> detalles = new ArrayList<>();

    @PrePersist
    void alCrear() {
        if (fechaVenta == null) {
            fechaVenta = LocalDateTime.now();
        }
    }
}

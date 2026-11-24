package com.farmasol.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "direcciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Direccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_direccion")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Cliente cliente;

    @Column(length = 50)
    private String alias;

    @Column(nullable = false, length = 255)
    private String direccion;

    @Column(length = 100)
    private String distrito;

    @Column(length = 100)
    private String ciudad;

    @Column(length = 255)
    private String referencia;

    @Column(name = "quien_recibe", nullable = false, length = 120)
    private String quienRecibe;

    @Column(name = "telefono_contacto", nullable = false, length = 20)
    private String telefonoContacto;

    @Column(name = "es_predeterminada", nullable = false)
    @Builder.Default
    private Boolean esPredeterminada = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
}

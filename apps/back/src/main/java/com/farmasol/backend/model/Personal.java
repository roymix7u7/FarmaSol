package com.farmasol.backend.model;

import com.farmasol.backend.model.enums.RolPersonal;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "personal", uniqueConstraints = {
        @UniqueConstraint(name = "uq_personal_usuario", columnNames = "usuario"),
        @UniqueConstraint(name = "uq_personal_correo", columnNames = "correo")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Personal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_personal")
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombres;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(nullable = false, length = 50)
    private String usuario;

    @Column(nullable = false, length = 150)
    private String correo;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RolPersonal rol;

    /** Gerente que creó esta cuenta. Nulo para el gerente raíz. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por")
    private Personal creadoPor;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    /**
     * Intentos fallidos seguidos en el login del portal. Nullable para que
     * ddl-auto pueda añadir la columna sobre personal ya registrado (nulo = 0).
     */
    @Column(name = "intentos_fallidos")
    @Builder.Default
    private Integer intentosFallidos = 0;

    /** Mientras esta fecha no haya pasado, la cuenta no puede iniciar sesión. */
    @Column(name = "bloqueado_hasta")
    private LocalDateTime bloqueadoHasta;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }
}

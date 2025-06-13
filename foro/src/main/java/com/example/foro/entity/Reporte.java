package com.example.foro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reporte {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "reportador_id", nullable = false)
    private Usuario reportador;

    @ManyToOne
    @JoinColumn(name = "reportado_id", nullable = false)
    private Usuario reportado;

    @ManyToOne
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne
    @JoinColumn(name = "comentario_id")
    private Comentario comentario;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String motivo;

    @Column(nullable = false)
    private boolean resuelto; // false: pendiente, true: resuelto

    @Column(nullable = false)
    private LocalDateTime fechaReporte;
}
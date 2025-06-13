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
public class Reputacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "emisor_id")
    private Usuario emisor;

    @ManyToOne(optional = false)
    @JoinColumn(name = "receptor_id")
    private Usuario receptor;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = false)
    private int valor = 1;
}

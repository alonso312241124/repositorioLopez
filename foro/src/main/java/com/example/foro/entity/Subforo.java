package com.example.foro.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subforo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column
    private String imagen;

    @Column
    private String descripcion;

    @OneToMany(mappedBy = "subforo", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Post> posts;
}
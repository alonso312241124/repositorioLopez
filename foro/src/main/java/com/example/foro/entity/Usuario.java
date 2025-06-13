package com.example.foro.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    @Email
    private String email;

    @Column(nullable = false, unique = true)
    private String username;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    private String foto;

    private LocalDateTime fechaRegistro;

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> authorities = Collections.emptyList();

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Post> posts;

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Comentario> comentarios;

    @Column(nullable = false)
    private Integer reputacion = 0;

    @OneToMany(mappedBy = "receptor", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Reputacion> reputacionesRecibidas;

    @OneToMany(mappedBy = "emisor", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Reputacion> reputacionesDadas;

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Favorito> favoritos;

    @OneToMany(mappedBy = "reportador", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Reporte> reportesHechos;

    @OneToMany(mappedBy = "reportado", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Reporte> reportesRecibidos;


    // Métodos de UserDetails
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities.stream().map(role -> (GrantedAuthority) () -> role).toList();
    }

    @Override
    public String getUsername() {
        return this.username; // Usamos el campo username, no el email como en el otro proyecto
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}
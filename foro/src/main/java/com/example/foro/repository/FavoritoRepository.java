package com.example.foro.repository;

import com.example.foro.entity.Favorito;
import com.example.foro.entity.Post;
import com.example.foro.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoritoRepository extends JpaRepository<Favorito, Long> {
    Optional<Favorito> findByUsuarioAndPost(Usuario usuario, Post post);
    List<Favorito> findByUsuario(Usuario usuario);
}

package com.example.foro.repository;

import com.example.foro.entity.Comentario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComentarioRepository extends JpaRepository<Comentario, Long> {
    List<Comentario> findByPostIdOrderByFechaCreacionAsc(Long postId);
    List<Comentario> findByUsuarioIdOrderByFechaCreacionDesc(Long usuarioId);
}
package com.example.foro.repository;

import com.example.foro.entity.FotoComentario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FotoComentarioRepository extends JpaRepository<FotoComentario, Long> {
}

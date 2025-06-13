package com.example.foro.repository;

import com.example.foro.entity.Reputacion;
import com.example.foro.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReputacionRepository extends JpaRepository<Reputacion, Long> {
    boolean existsByEmisorAndReceptor(Usuario emisor, Usuario receptor);
}

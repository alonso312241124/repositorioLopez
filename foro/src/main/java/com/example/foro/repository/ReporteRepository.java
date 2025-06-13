package com.example.foro.repository;

import com.example.foro.entity.Reporte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReporteRepository extends JpaRepository<Reporte, Long> {
    List<Reporte> findByResueltoFalse(); // Para obtener reportes pendientes
    List<Reporte> findByResueltoTrue(); // Para obtener reportes resueltos
    List<Reporte> findByResueltoFalseOrderByFechaReporteAsc(); // Útil para administradores
    List<Reporte> findAllByOrderByFechaReporteDesc();
}

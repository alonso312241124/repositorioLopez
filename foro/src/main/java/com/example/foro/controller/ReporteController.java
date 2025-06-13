package com.example.foro.controller;

import com.example.foro.DTO.ReporteRequestDTO; 
import com.example.foro.DTO.ReporteResponseDTO; 
import com.example.foro.services.ReporteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    @Autowired
    private ReporteService reporteService;

    @PostMapping
    @PreAuthorize("isAuthenticated()") // Solo usuarios autenticados pueden reportar
    public ResponseEntity<ReporteResponseDTO> crearReporte(@RequestBody ReporteRequestDTO reporteRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String usernameReportador = authentication.getName();

        try {
            ReporteResponseDTO nuevoReporte = reporteService.crearReporte(reporteRequest, usernameReportador);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoReporte);
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(null);
        }
    }

    @GetMapping("/pendientes")
    @PreAuthorize("hasRole('ADMIN')") // Solo usuarios con rol ADMIN
    public ResponseEntity<List<ReporteResponseDTO>> obtenerReportesPendientes() {
        List<ReporteResponseDTO> reportes = reporteService.obtenerReportesPendientes();
        return ResponseEntity.ok(reportes);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReporteResponseDTO>> obtenerTodosLosReportes() {
        List<ReporteResponseDTO> reportes = reporteService.obtenerTodosLosReportes();
        return ResponseEntity.ok(reportes);
    }

    @PutMapping("/{reporteId}/resolver")
    @PreAuthorize("hasRole('ADMIN')") // Solo usuarios con rol ADMIN
    public ResponseEntity<ReporteResponseDTO> resolverReporte(@PathVariable Long reporteId) {
        try {
            ReporteResponseDTO reporteResuelto = reporteService.resolverReporte(reporteId);
            return ResponseEntity.ok(reporteResuelto);
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(null);
        }
    }
}
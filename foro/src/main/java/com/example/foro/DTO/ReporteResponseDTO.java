package com.example.foro.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteResponseDTO {
    private Long id;
    private String reportadorUsername;
    private String reportadoUsername; // Puede ser null si el reporte no es directamente sobre un usuario
    private Long postId;
    private String postTitulo; 
    private Long comentarioId;
    private String comentarioContenido; 
    private String motivo;
    private boolean resuelto;
    private LocalDateTime fechaReporte;
}

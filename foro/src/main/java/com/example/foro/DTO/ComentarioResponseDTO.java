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
public class ComentarioResponseDTO {
    private Long id;
    private String contenido;
    private LocalDateTime fechaCreacion;
    private UsuarioSummaryResponseDTO usuario; // Resumen del usuario
    private PostSummaryResponseDTO post; // Resumen del post
}
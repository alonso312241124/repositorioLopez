package com.example.foro.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteRequestDTO {
    private Long reportadoId; // Opcional, si se reporta un usuario directamente
    private Long postId; // Opcional, si se reporta un post
    private Long comentarioId; // Opcional, si se reporta un comentario
    private String motivo;
}

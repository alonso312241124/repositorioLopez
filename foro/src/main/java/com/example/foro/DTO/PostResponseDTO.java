package com.example.foro.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponseDTO {
    private Long id;
    private String titulo;
    private String contenido;
    private LocalDateTime fechaCreacion;
    private UsuarioSummaryResponseDTO usuario; // DTO resumido del usuario
    private SubforoSummaryResponseDTO subforo; // DTO resumido del subforo
    private List<String> fotos; // URLs de las fotos

}

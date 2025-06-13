package com.example.foro.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComentarioCreateRequestDTO {
    @NotNull(message = "El ID del post no puede ser nulo")
    private Long postId;

    @NotBlank(message = "El contenido del comentario no puede estar vacío")
    private String contenido;
}
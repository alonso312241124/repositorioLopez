package com.example.foro.DTO;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostResumenDTO {
    private Long id;
    private String titulo;
    private String autorUsername;
    private LocalDateTime fechaCreacion;
}
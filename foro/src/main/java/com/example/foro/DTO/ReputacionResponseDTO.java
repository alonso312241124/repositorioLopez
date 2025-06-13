package com.example.foro.DTO;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReputacionResponseDTO {
    private Long id;
    private String emisorUsername;
    private String receptorUsername;
    private LocalDateTime fecha;
    private int valor;
    private int nuevaReputacionTotal;
}
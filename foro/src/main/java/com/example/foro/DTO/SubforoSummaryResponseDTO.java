package com.example.foro.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubforoSummaryResponseDTO {
    private Long id;
    private String nombre;
    private String descripcion;
    private String imagen;
}

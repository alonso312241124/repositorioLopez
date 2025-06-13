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
public class RegisterResponseDTO {
    private Long id;
    private String username;
    private String email;
    private String foto;
    private Integer reputacion;
    private LocalDateTime fechaRegistro;
    private List<String> authorities;
}

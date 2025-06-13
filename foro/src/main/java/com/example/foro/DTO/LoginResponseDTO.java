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
public class LoginResponseDTO {
    private String token;
    private Long userId;
    private String username;
    private String foto;          
    private LocalDateTime fechaRegistro;
    private Integer reputacion;  
    private List<String> roles;
}

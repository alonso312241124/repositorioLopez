package com.example.foro.DTO;

import lombok.Data;

@Data
public class UsuarioRankingDTO {
    private Long id;
    private String username;
    private Integer reputacion;
    private Integer posicion;
    private String foto;
    private boolean esAdmin;
}
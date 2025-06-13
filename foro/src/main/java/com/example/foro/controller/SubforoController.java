package com.example.foro.controller;

import com.example.foro.DTO.SubforoSummaryResponseDTO;
import com.example.foro.entity.Subforo;
import com.example.foro.repository.SubforoRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subforos")
public class SubforoController {

    @Autowired
    private SubforoRepository subforoRepository;

    @GetMapping
    public ResponseEntity<List<SubforoSummaryResponseDTO>> obtenerSubforos() {
        // Obtenemos todos los subforos como entidades completas desde la bd
        List<Subforo> subforosDesdeBD = subforoRepository.findAll();

        // Transformamos las entidades a DTOs para no devolver todos los posts, listados en la entidad, mejorando la velocidad
        List<SubforoSummaryResponseDTO> subforosDTO = subforosDesdeBD
                .stream()
                .map(subforoEntidad -> {
                    return SubforoSummaryResponseDTO
                            .builder()
                            .id(subforoEntidad.getId())
                            .nombre(subforoEntidad.getNombre())
                            .descripcion(subforoEntidad.getDescripcion())
                            .imagen(subforoEntidad.getImagen())
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(subforosDTO);
    }
}

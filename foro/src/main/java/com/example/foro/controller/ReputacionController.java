package com.example.foro.controller;

import com.example.foro.DTO.ReputacionRequestDTO;
import com.example.foro.DTO.ReputacionResponseDTO;
import com.example.foro.DTO.UsuarioRankingDTO;
import com.example.foro.entity.Reputacion;
import com.example.foro.entity.Usuario;
import com.example.foro.repository.ReputacionRepository;
import com.example.foro.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/reputacion")
public class ReputacionController {

    @Autowired
    private ReputacionRepository reputacionRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<ReputacionResponseDTO> darReputacion(@RequestBody ReputacionRequestDTO reputacionRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String usernameEmisor = authentication.getName();

        try {
            // Buscar emisor
            Usuario emisor = usuarioRepository.findByUsername(usernameEmisor)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario emisor no encontrado"));

            // Buscar receptor
            Usuario receptor = usuarioRepository.findById(reputacionRequest.getReceptorId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario receptor no encontrado"));

            // Verificar que no sea el mismo usuario
            if (emisor.getId().equals(receptor.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes darte reputación a ti mismo");
            }

            // Verificar que no haya dado reputación antes
            if (reputacionRepository.existsByEmisorAndReceptor(emisor, receptor)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya has dado reputación a este usuario");
            }

            // Crear nueva reputación con valor fijo de 1 punto
            Reputacion nuevaReputacion = Reputacion.builder()
                    .emisor(emisor)
                    .receptor(receptor)
                    .fecha(LocalDateTime.now())
                    .valor(1) // Siempre 1 punto por reputación
                    .build();

            reputacionRepository.save(nuevaReputacion);

            // Actualizar reputación del receptor sumando exactamente 1 punto
            receptor.setReputacion(receptor.getReputacion() + 1);
            usuarioRepository.save(receptor);

            // Crear respuesta
            ReputacionResponseDTO response = new ReputacionResponseDTO();
            response.setId(nuevaReputacion.getId());
            response.setEmisorUsername(emisor.getUsername());
            response.setReceptorUsername(receptor.getUsername());
            response.setFecha(nuevaReputacion.getFecha());
            response.setValor(1);
            response.setNuevaReputacionTotal(receptor.getReputacion());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del servidor");
        }
    }

    @GetMapping("/verificar/{receptorId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Boolean> verificarReputacionDada(@PathVariable Long receptorId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String usernameEmisor = authentication.getName();

        try {
            // Buscar emisor
            Usuario emisor = usuarioRepository.findByUsername(usernameEmisor)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario emisor no encontrado"));

            // Buscar receptor
            Usuario receptor = usuarioRepository.findById(receptorId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario receptor no encontrado"));

            // Verificar si ya existe una reputación entre estos usuarios
            boolean yaDidoReputacion = reputacionRepository.existsByEmisorAndReceptor(emisor, receptor);

            return ResponseEntity.ok(yaDidoReputacion);

        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.ok(false);
        }
    }

    @GetMapping("/total/{userId}")
    public ResponseEntity<Integer> obtenerReputacionTotal(@PathVariable Long userId) {
        try {
            Usuario usuario = usuarioRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

            return ResponseEntity.ok(usuario.getReputacion());

        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del servidor");
        }
    }

    @GetMapping("/top3")
    public ResponseEntity<List<UsuarioRankingDTO>> obtenerTop3Reputacion() {
        try {

            List<Usuario> topUsuarios = usuarioRepository.findTop3ByOrderByReputacionDesc();
            System.out.println("Usuarios encontrados: " + topUsuarios.size());

            List<UsuarioRankingDTO> ranking = new ArrayList<>();
            for (int i = 0; i < topUsuarios.size(); i++) {
                Usuario usuario = topUsuarios.get(i);
                System.out.println("Usuario: " + i + " " + usuario.getUsername() + " con reputación: " + usuario.getReputacion());

                UsuarioRankingDTO dto = new UsuarioRankingDTO();
                dto.setId(usuario.getId());
                dto.setUsername(usuario.getUsername());
                dto.setReputacion(usuario.getReputacion());
                dto.setPosicion(i + 1);
                dto.setFoto(usuario.getFoto());

                boolean esAdmin = usuario.getAuthorities().stream()
                        .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
                dto.setEsAdmin(esAdmin);

                ranking.add(dto);
            }

            return ResponseEntity.ok(ranking);

        } catch (Exception ex) {
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al obtener el top 3: " + ex.getMessage());
        }
    }
}
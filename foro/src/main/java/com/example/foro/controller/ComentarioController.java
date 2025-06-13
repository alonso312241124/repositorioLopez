package com.example.foro.controller;

import com.example.foro.DTO.ComentarioCreateRequestDTO;
import com.example.foro.DTO.ComentarioResponseDTO;
import com.example.foro.DTO.PostSummaryResponseDTO;
import com.example.foro.DTO.UsuarioSummaryResponseDTO;
import com.example.foro.entity.Comentario;
import com.example.foro.entity.Post;
import com.example.foro.entity.Usuario;
import com.example.foro.repository.ComentarioRepository;
import com.example.foro.repository.PostRepository;
import com.example.foro.repository.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException; 

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/comentarios")
public class ComentarioController {

    @Autowired
    private ComentarioRepository comentarioRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PostRepository postRepository;


    @PostMapping
    public ResponseEntity<?> crearComentario(
            @Valid @RequestBody ComentarioCreateRequestDTO comentarioCreateDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"message\": \"Usuario no autenticado.\"}");
        }

        String currentUsername = authentication.getName();
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(currentUsername);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"message\": \"Usuario del token no encontrado: " + currentUsername + "\"}");
        }
        Usuario usuarioActual = usuarioOpt.get();

        Optional<Post> postOpt = postRepository.findById(comentarioCreateDTO.getPostId());
        if (postOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"message\": \"Post no encontrado con ID: " + comentarioCreateDTO.getPostId() + "\"}");
        }
        Post post = postOpt.get();

        Comentario nuevoComentario = Comentario.builder()
                .contenido(comentarioCreateDTO.getContenido())
                .post(post)
                .usuario(usuarioActual)
                .fechaCreacion(LocalDateTime.now())
                .build();

        Comentario comentarioGuardado = comentarioRepository.save(nuevoComentario);

        ComentarioResponseDTO responseDTO = mapComentarioToResponseDTO(comentarioGuardado);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarComentario(@PathVariable Long id, @Valid @RequestBody ComentarioCreateRequestDTO comentarioUpdateDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"message\": \"Usuario no autenticado.\"}");
        }

        String currentUsername = authentication.getName();

        Optional<Comentario> comentarioOpt = comentarioRepository.findById(id);
        if (comentarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"Comentario no encontrado.\"}");
        }
        Comentario comentarioExistente = comentarioOpt.get();

        boolean isAuthor = comentarioExistente.getUsuario().getUsername().equals(currentUsername);
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAuthor && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("{\"message\": \"No tienes permiso para editar este comentario.\"}");
        }

        comentarioExistente.setContenido(comentarioUpdateDTO.getContenido());

        Comentario comentarioActualizado = comentarioRepository.save(comentarioExistente);
        ComentarioResponseDTO responseDTO = mapComentarioToResponseDTO(comentarioActualizado);
        return ResponseEntity.ok(responseDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarComentario(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"message\": \"Usuario no autenticado.\"}");
        }

        String currentUsername = authentication.getName();

        Optional<Comentario> comentarioOpt = comentarioRepository.findById(id);
        if (comentarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"Comentario no encontrado.\"}");
        }
        Comentario comentarioExistente = comentarioOpt.get();

        boolean isAuthor = comentarioExistente.getUsuario().getUsername().equals(currentUsername);
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAuthor && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("{\"message\": \"No tienes permiso para eliminar este comentario.\"}");
        }

        comentarioRepository.delete(comentarioExistente);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body("{\"message\": \"Comentario eliminado correctamente.\"}");
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<ComentarioResponseDTO>> obtenerComentariosPorPostId(
            @PathVariable Long postId) {
        if (!postRepository.existsById(postId)) {
            return ResponseEntity.notFound().build();
        }

        List<Comentario> comentarios =
                comentarioRepository.findByPostIdOrderByFechaCreacionAsc(postId);

        List<ComentarioResponseDTO> responseDTOs = comentarios.stream()
                .map(this::mapComentarioToResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responseDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComentarioResponseDTO> obtenerComentarioPorId(
            @PathVariable Long id) {
        return comentarioRepository
                .findById(id)
                .map(this::mapComentarioToResponseDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{username}")
    public ResponseEntity<List<ComentarioResponseDTO>> obtenerComentariosPorUsuarioUsername(
            @PathVariable String username) {

        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(username);
        if (usuarioOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con username: " + username);
        }

        Usuario usuario = usuarioOpt.get();
        List<Comentario> comentarios = comentarioRepository.findByUsuarioIdOrderByFechaCreacionDesc(usuario.getId());

        List<ComentarioResponseDTO> responseDTOs = comentarios.stream()
                .map(this::mapComentarioToResponseDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseDTOs);
    }

    private ComentarioResponseDTO mapComentarioToResponseDTO(Comentario comentario) {
        if (comentario.getUsuario() == null) {
            System.err.println("Advertencia: Comentario con usuario nulo ID: " + comentario.getId());
            return ComentarioResponseDTO.builder()
                    .id(comentario.getId())
                    .contenido(comentario.getContenido())
                    .fechaCreacion(comentario.getFechaCreacion())
                    .usuario(null)
                    .post(PostSummaryResponseDTO.builder().id(comentario.getPost().getId()).titulo(comentario.getPost().getTitulo()).build())
                    .build();
        }

        Usuario usuarioOriginal = comentario.getUsuario();

        UsuarioSummaryResponseDTO usuarioSummary = UsuarioSummaryResponseDTO.builder()
                .id(usuarioOriginal.getId())
                .username(usuarioOriginal.getUsername())
                .foto(usuarioOriginal.getFoto())
                .fechaRegistro(usuarioOriginal.getFechaRegistro())
                .reputacion(usuarioOriginal.getReputacion())
                .authorities(usuarioOriginal.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList())
                .build();

        PostSummaryResponseDTO postSummary = PostSummaryResponseDTO.builder()
                .id(comentario.getPost().getId())
                .titulo(comentario.getPost().getTitulo())
                .build();

        return ComentarioResponseDTO.builder()
                .id(comentario.getId())
                .contenido(comentario.getContenido())
                .fechaCreacion(comentario.getFechaCreacion())
                .usuario(usuarioSummary)
                .post(postSummary)
                .build();
    }
}
package com.example.foro.controller;

import com.example.foro.DTO.PostResumenDTO;
import com.example.foro.entity.Favorito;
import com.example.foro.entity.Post;
import com.example.foro.entity.Usuario;
import com.example.foro.repository.FavoritoRepository;
import com.example.foro.repository.PostRepository;
import com.example.foro.repository.UsuarioRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favoritos")
public class FavoritoController {

    @Autowired
    private FavoritoRepository favoritoRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;


    @PostMapping("/{postId}")
    public ResponseEntity<?> agregarFavorito(@PathVariable Long postId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (
                authentication == null ||
                        !authentication.isAuthenticated() ||
                        "anonymousUser".equals(authentication.getPrincipal())
        ) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"message\": \"Usuario no autenticado.\"}");
        }

        String currentUsername = authentication.getName();
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(currentUsername);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(
                            "{\"message\": \"Usuario del token no encontrado: " +
                                    currentUsername +
                                    "\"}"
                    );
        }
        Usuario usuarioActual = usuarioOpt.get();

        Optional<Post> postOpt = postRepository.findById(postId);
        if (postOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"message\": \"Post no encontrado con ID: " + postId + "\"}");
        }
        Post post = postOpt.get();

        if (favoritoRepository.findByUsuarioAndPost(usuarioActual, post).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("{\"message\": \"Este post ya está marcado como favorito por el usuario.\"}");
        }

        Favorito nuevoFavorito =
                Favorito.builder().usuario(usuarioActual).post(post).build();
        Favorito favoritoGuardado = favoritoRepository.save(nuevoFavorito);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("{\"message\": \"Post marcado como favorito exitosamente.\"}");
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> eliminarFavorito(@PathVariable Long postId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (
                authentication == null ||
                        !authentication.isAuthenticated() ||
                        "anonymousUser".equals(authentication.getPrincipal())
        ) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"message\": \"Usuario no autenticado.\"}");
        }

        String currentUsername = authentication.getName();
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(currentUsername);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(
                            "{\"message\": \"Usuario del token no encontrado: " +
                                    currentUsername +
                                    "\"}"
                    );
        }
        Usuario usuarioActual = usuarioOpt.get();

        Optional<Post> postOpt = postRepository.findById(postId);
        if (postOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"message\": \"Post no encontrado con ID: " + postId + "\"}");
        }
        Post post = postOpt.get();

        Optional<Favorito> favoritoOpt =
                favoritoRepository.findByUsuarioAndPost(usuarioActual, post);
        if (favoritoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"message\": \"Este post no está marcado como favorito por el usuario.\"}");
        }

        favoritoRepository.delete(favoritoOpt.get());

        return ResponseEntity.ok()
                .body("{\"message\": \"Post eliminado de favoritos correctamente.\"}");
    }

    @GetMapping("/estado/{postId}")
    public ResponseEntity<?> verificarEstadoFavorito(@PathVariable Long postId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (
                authentication == null ||
                        !authentication.isAuthenticated() ||
                        "anonymousUser".equals(authentication.getPrincipal())
        ) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"message\": \"Usuario no autenticado.\"}");
        }

        String currentUsername = authentication.getName();
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(currentUsername);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(
                            "{\"message\": \"Usuario del token no encontrado: " +
                                    currentUsername +
                                    "\"}"
                    );
        }
        Usuario usuarioActual = usuarioOpt.get();

        Optional<Post> postOpt = postRepository.findById(postId);
        if (postOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"message\": \"Post no encontrado con ID: " + postId + "\"}");
        }
        Post post = postOpt.get();

        boolean esFavorito = favoritoRepository.findByUsuarioAndPost(usuarioActual, post).isPresent();

        return ResponseEntity.ok(esFavorito);
    }

    @GetMapping
    public ResponseEntity<?> getFavoritosDelUsuario() {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();
        if (
                authentication == null ||
                        !authentication.isAuthenticated() ||
                        "anonymousUser".equals(authentication.getPrincipal())
        ) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("{\"message\": \"Usuario no autenticado.\"}");
        }

        String currentUsername = authentication.getName();
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(
                currentUsername
        );
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("{\"message\": \"Usuario del token no encontrado: " + currentUsername + "\"}");
        }
        Usuario usuarioActual = usuarioOpt.get();

        List<Favorito> favoritos = favoritoRepository.findByUsuario(usuarioActual);

        List<PostResumenDTO> postsFavoritos = favoritos
                .stream()
                .map(favorito -> {
                    Post post = favorito.getPost();
                    return new PostResumenDTO(
                            post.getId(),
                            post.getTitulo(),
                            post.getUsuario().getUsername(),
                            post.getFechaCreacion()
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(postsFavoritos);
    }
}
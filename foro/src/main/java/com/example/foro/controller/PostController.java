package com.example.foro.controller;

import com.example.foro.DTO.PostCreateRequestDTO;
import com.example.foro.DTO.PostResponseDTO;
import com.example.foro.DTO.SubforoSummaryResponseDTO;
import com.example.foro.DTO.UsuarioSummaryResponseDTO;
import com.example.foro.entity.FotoPost;
import com.example.foro.entity.Post;
import com.example.foro.entity.Subforo;
import com.example.foro.entity.Usuario;
import com.example.foro.repository.FotoPostRepository;
import com.example.foro.repository.PostRepository;
import com.example.foro.repository.SubforoRepository;
import com.example.foro.repository.UsuarioRepository;
import com.example.foro.services.FileStorageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/blog")
public class PostController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SubforoRepository subforoRepository;

    @Autowired
    private FotoPostRepository fotoPostRepository;

    @Autowired
    private FileStorageService fileStorageService;


    // Endpoint para posts sin imágenes (JSON)
    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> crearPost(@Valid @RequestBody PostCreateRequestDTO postCreateDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
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

        Optional<Subforo> subforoOpt = subforoRepository.findById(postCreateDTO.getSubforoId());
        if (subforoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"message\": \"Subforo no encontrado con ID: " + postCreateDTO.getSubforoId() + "\"}");
        }
        Subforo subforo = subforoOpt.get();

        Post nuevoPost = Post.builder()
                .titulo(postCreateDTO.getTitulo())
                .contenido(postCreateDTO.getContenido())
                .usuario(usuarioActual)
                .subforo(subforo)
                .fechaCreacion(LocalDateTime.now())
                .build();
        Post postGuardado = postRepository.save(nuevoPost);

        PostResponseDTO responseDTO = mapPostToResponseDTO(postGuardado);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
    }

    // Endpoint para posts con imágenes (multipart)
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<?> crearPostConImagenes(
            @RequestParam("titulo") String titulo,
            @RequestParam("contenido") String contenido,
            @RequestParam("subforoId") Long subforoId,
            @RequestParam(value = "imagenes", required = false)
            List<MultipartFile> imagenes
    ) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"message\": \"Usuario no autenticado.\"}");
        }

        String currentUsername = authentication.getName();
        Optional<Usuario> usuarioOpt =
                usuarioRepository.findByUsername(currentUsername);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(
                            "{\"message\": \"Usuario del token no encontrado: " +
                                    currentUsername +
                                    "\"}"
                    );
        }
        Usuario usuarioActual = usuarioOpt.get();

        Optional<Subforo> subforoOpt = subforoRepository.findById(subforoId);
        if (subforoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(
                            "{\"message\": \"Subforo no encontrado con ID: " +
                                    subforoId +
                                    "\"}"
                    );
        }
        Subforo subforo = subforoOpt.get();

        try {
            // 1. Crear la instancia del post, pero sin las fotos todavía
            Post nuevoPost = Post.builder()
                    .titulo(titulo)
                    .contenido(contenido)
                    .usuario(usuarioActual)
                    .subforo(subforo)
                    .fechaCreacion(LocalDateTime.now())
                    .build();

            // 2. Guardar el objeto 'nuevoPost'.
            Post postGuardado = postRepository.save(nuevoPost);

            // 3. Procesar y guardar las imágenes, asociándolas al 'postGuardado'
            List<FotoPost> fotosGuardadas = new ArrayList<>();
            if (imagenes != null && !imagenes.isEmpty()) {
                for (MultipartFile imagen : imagenes) {
                    if (!imagen.isEmpty()) {
                        String rutaArchivo = fileStorageService.storeFile(imagen);

                        FotoPost foto = FotoPost.builder()
                                .post(postGuardado) // Se usa el post ya guardado
                                .foto(rutaArchivo)
                                .build();

                        // Guardar cada foto individualmente
                        fotosGuardadas.add(fotoPostRepository.save(foto));
                    }
                }
            }

            // 4. Actualizar la lista de fotos en la entidad Post en memoria
            //    para que la respuesta DTO sea completa.
            postGuardado.setFotos(fotosGuardadas);

            PostResponseDTO responseDTO = mapPostToResponseDTO(postGuardado);
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            "{\"message\": \"Error al crear el post: " +
                                    e.getMessage() +
                                    "\"}"
                    );
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarPost(@PathVariable Long id, @Valid @RequestBody PostCreateRequestDTO postUpdateDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"message\": \"Usuario no autenticado.\"}");
        }

        String currentUsername = authentication.getName();

        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"Post no encontrado.\"}");
        }
        Post postExistente = postOpt.get();

        boolean isAuthor = postExistente.getUsuario().getUsername().equals(currentUsername);
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAuthor && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("{\"message\": \"No tienes permiso para editar este post.\"}");
        }

        postExistente.setTitulo(postUpdateDTO.getTitulo());
        postExistente.setContenido(postUpdateDTO.getContenido());

        Post postActualizado = postRepository.save(postExistente);
        PostResponseDTO responseDTO = mapPostToResponseDTO(postActualizado);
        return ResponseEntity.ok(responseDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarPost(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"message\": \"Usuario no autenticado.\"}");
        }

        String currentUsername = authentication.getName();

        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"Post no encontrado.\"}");
        }
        Post postExistente = postOpt.get();

        boolean isAuthor = postExistente.getUsuario().getUsername().equals(currentUsername);
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAuthor && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("{\"message\": \"No tienes permiso para eliminar este post.\"}");
        }

        postRepository.delete(postExistente);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body("{\"message\": \"Post eliminado correctamente.\"}");
    }

    @GetMapping
    public ResponseEntity<List<PostResponseDTO>> obtenerPosts(
            @RequestParam(required = false) Long subforoId) {
        List<Post> posts;
        if (subforoId != null) {
            if (!subforoRepository.existsById(subforoId)) {
                return ResponseEntity.ok(List.of());
            }
            posts = postRepository.findBySubforoIdOrderByFechaCreacionDesc(subforoId);
        } else {
            posts = postRepository.findAllByOrderByFechaCreacionDesc();
        }

        List<PostResponseDTO> responseDTOs = posts.stream()
                .map(this::mapPostToResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responseDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponseDTO> obtenerPostPorId(@PathVariable Long id) {
        return postRepository.findById(id)
                .map(this::mapPostToResponseDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private PostResponseDTO mapPostToResponseDTO(Post post) {
        Usuario usuarioOriginal = post.getUsuario();

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

        SubforoSummaryResponseDTO subforoSummary = SubforoSummaryResponseDTO.builder()
                .id(post.getSubforo().getId())
                .nombre(post.getSubforo().getNombre())
                .build();

        // Mapear las fotos
        List<String> fotosUrls = new ArrayList<>();
        if (post.getFotos() != null) {
            fotosUrls = post.getFotos().stream()
                    .map(FotoPost::getFoto)
                    .collect(Collectors.toList());
        }

        return PostResponseDTO.builder()
                .id(post.getId())
                .titulo(post.getTitulo())
                .contenido(post.getContenido())
                .fechaCreacion(post.getFechaCreacion())
                .usuario(usuarioSummary)
                .subforo(subforoSummary)
                .fotos(fotosUrls)
                .build();
    }
}
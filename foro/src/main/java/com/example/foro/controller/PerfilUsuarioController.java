package com.example.foro.controller;

import com.example.foro.DTO.PerfilUsuarioDTO;
import com.example.foro.entity.Usuario;
import com.example.foro.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/perfil")
@RequiredArgsConstructor
public class PerfilUsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir:uploads/}")
    private String uploadDir;

    @GetMapping("/{username}")
    public ResponseEntity<PerfilUsuarioDTO> obtenerPerfilPorUsername(@PathVariable String username) {
        Optional<Usuario> usuarioOptional = usuarioRepository.findByUsername(username);

        if (usuarioOptional.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con username: " + username);
        }

        Usuario usuario = usuarioOptional.get();
        PerfilUsuarioDTO perfilUsuarioDTO = mapearAPerfilDTO(usuario);
        return ResponseEntity.ok(perfilUsuarioDTO);
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<PerfilUsuarioDTO> obtenerPerfilPorId(@PathVariable Long id) {
        Optional<Usuario> usuarioOptional = usuarioRepository.findById(id);

        if (usuarioOptional.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con ID: " + id);
        }

        Usuario usuario = usuarioOptional.get();
        PerfilUsuarioDTO perfilUsuarioDTO = mapearAPerfilDTO(usuario);
        return ResponseEntity.ok(perfilUsuarioDTO);
    }

    @PutMapping("/editar")
    public ResponseEntity<Map<String, Object>> editarPerfil(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) MultipartFile foto,
            Authentication authentication) {

        String username = authentication.getName();
        Optional<Usuario> usuarioOptional = usuarioRepository.findByUsername(username);

        if (usuarioOptional.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }

        Usuario usuario = usuarioOptional.get();

        try {
            // Actualizar email si se proporciona
            if (email != null && !email.trim().isEmpty()) {
                // Verificar que el email no esté en uso por otro usuario
                Optional<Usuario> usuarioConEmail = usuarioRepository.findByEmail(email);
                if (usuarioConEmail.isPresent() && !usuarioConEmail.get().getId().equals(usuario.getId())) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "El email ya está en uso"));
                }
                usuario.setEmail(email);
            }

            // Actualizar contraseña si se proporciona
            if (password != null && !password.trim().isEmpty()) {
                if (password.length() < 6) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "La contraseña debe tener al menos 6 caracteres"));
                }
                usuario.setPassword(passwordEncoder.encode(password));
            }

            // Manejar foto de perfil
            if (foto != null && !foto.isEmpty()) {
                String nombreArchivo = guardarImagen(foto);
                usuario.setFoto("uploads/" + nombreArchivo);
            }

            usuarioRepository.save(usuario);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Perfil actualizado correctamente",
                    "perfil", mapearAPerfilDTO(usuario)
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error al actualizar el perfil: " + e.getMessage()));
        }
    }

    private String guardarImagen(MultipartFile archivo) throws IOException {
        // Crear directorio si no existe
        Path directorioUpload = Paths.get(uploadDir);
        if (!Files.exists(directorioUpload)) {
            Files.createDirectories(directorioUpload);
        }

        // Generar nombre único para el archivo
        String extension = getExtensionArchivo(archivo.getOriginalFilename());
        String nombreArchivo = UUID.randomUUID().toString() + "." + extension;
        Path rutaArchivo = directorioUpload.resolve(nombreArchivo);

        // Guardar archivo
        Files.copy(archivo.getInputStream(), rutaArchivo, StandardCopyOption.REPLACE_EXISTING);

        return nombreArchivo;
    }

    private String getExtensionArchivo(String nombreArchivo) {
        if (nombreArchivo != null && nombreArchivo.contains(".")) {
            return nombreArchivo.substring(nombreArchivo.lastIndexOf(".") + 1).toLowerCase();
        }
        return "jpg";
    }

    private PerfilUsuarioDTO mapearAPerfilDTO(Usuario usuario) {
        PerfilUsuarioDTO perfilUsuarioDTO = new PerfilUsuarioDTO();
        perfilUsuarioDTO.setId(usuario.getId());
        perfilUsuarioDTO.setEmail(usuario.getEmail());
        perfilUsuarioDTO.setUsername(usuario.getUsername());
        perfilUsuarioDTO.setFoto(usuario.getFoto());
        perfilUsuarioDTO.setFechaRegistro(usuario.getFechaRegistro());
        perfilUsuarioDTO.setReputacion(usuario.getReputacion());
        perfilUsuarioDTO.setAuthorities(usuario.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        return perfilUsuarioDTO;
    }
}
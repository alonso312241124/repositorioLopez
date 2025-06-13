package com.example.foro.controller;

import com.example.foro.DTO.LoginRequestDTO;
import com.example.foro.DTO.LoginResponseDTO;
import com.example.foro.DTO.RegisterDTO;
import com.example.foro.DTO.RegisterResponseDTO;
import com.example.foro.config.JwtTokenProvider;
import com.example.foro.entity.Usuario;
import com.example.foro.repository.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDTO> registrarUsuario(@Valid @RequestBody RegisterDTO registroDTO) {
        if (usuarioRepository.findByUsername(registroDTO.getUsername()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de usuario ya está en uso.");
        }
        if (usuarioRepository.findByEmail(registroDTO.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email ya está en uso.");
        }

        Usuario nuevoUsuario = Usuario.builder()
                .username(registroDTO.getUsername())
                .email(registroDTO.getEmail())
                .password(passwordEncoder.encode(registroDTO.getPassword()))
                .fechaRegistro(LocalDateTime.now())
                .reputacion(0)
                .authorities(List.of("ROLE_USER"))
                .build();

        Usuario usuarioGuardado = usuarioRepository.save(nuevoUsuario);

        // Convertir authorities a una lista de Strings para devolverla como List<String>
        List<String> authoritiesStrings = usuarioGuardado.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority) // Obtiene el String de cada GrantedAuthority
                .collect(Collectors.toList());      // Lo recolecta en una nueva List<String>

        // Mapear a RegisterResponseDTO
        RegisterResponseDTO responseDTO = RegisterResponseDTO.builder()
                .id(usuarioGuardado.getId())
                .username(usuarioGuardado.getUsername())
                .email(usuarioGuardado.getEmail())
                .foto(usuarioGuardado.getFoto())
                .reputacion(usuarioGuardado.getReputacion())
                .fechaRegistro(usuarioGuardado.getFechaRegistro())
                .authorities(authoritiesStrings)
                .build();

        return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> loginUsuario(@Valid @RequestBody LoginRequestDTO loginDTO) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginDTO.getUsername(),
                            loginDTO.getPassword()
                    )
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            Usuario usuarioAutenticado = (Usuario) authentication.getPrincipal();
            String token = tokenProvider.generateToken(authentication);

            List<String> roles = usuarioAutenticado.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            LoginResponseDTO responseDTO = LoginResponseDTO.builder()
                    .token(token)
                    .userId(usuarioAutenticado.getId())
                    .username(usuarioAutenticado.getUsername())
                    .foto(usuarioAutenticado.getFoto())           
                    .fechaRegistro(usuarioAutenticado.getFechaRegistro()) 
                    .reputacion(usuarioAutenticado.getReputacion())
                    .roles(roles)
                    .build();

            return ResponseEntity.ok(responseDTO);

        } catch (BadCredentialsException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas.", e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error durante el login.", e);
        }
    }
}
package com.example.foro.services; // O el paquete que uses para tus servicios

import com.example.foro.entity.Usuario; // Importa la entidad Usuario de tu proyecto foro
import com.example.foro.repository.UsuarioRepository; // Importa el Repositorio de tu proyecto foro
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Autowired
    public UserDetailsServiceImpl(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = this.usuarioRepository.findByUsername(username) 
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con username: " + username));

        return usuario;
    }
}

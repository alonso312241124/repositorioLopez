package com.example.foro.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity; 
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final UserDetailsService userDetailsService;

    public SecurityConfig(UserDetailsService userDetailsService, JwtFilter jwtFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public AuthenticationManager authenticationManager(PasswordEncoder passwordEncoder,
                                                       UserDetailsService userDetailsService) throws Exception {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(authProvider);
    }

    /*
    {
    "titulo": "Post nuevo",
    "contenido": "Contenido del nuevo post.",
    "subforoId": 1
    }
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.and())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // No requieren autenticación
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/subforos", "/api/blog/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comentarios/post/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comentarios/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/perfil/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reputacion/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                        // Requieren autenticación
                        .requestMatchers(HttpMethod.POST, "/api/blog/upload").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/blog").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/blog/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/blog/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/comentarios").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/comentarios/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/favoritos").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/favoritos/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/comentarios/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/reportes").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/reportes/pendientes").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/reportes/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
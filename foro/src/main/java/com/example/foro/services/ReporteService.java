package com.example.foro.services;

import com.example.foro.DTO.ReporteRequestDTO;
import com.example.foro.DTO.ReporteResponseDTO;
import com.example.foro.entity.Comentario;
import com.example.foro.entity.Post;
import com.example.foro.entity.Reporte;
import com.example.foro.entity.Usuario;
import com.example.foro.repository.ComentarioRepository;
import com.example.foro.repository.PostRepository;
import com.example.foro.repository.ReporteRepository;
import com.example.foro.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReporteService {

    @Autowired
    private ReporteRepository reporteRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private ComentarioRepository comentarioRepository;

    @Transactional
    public ReporteResponseDTO crearReporte(ReporteRequestDTO reporteRequest, String usernameReportador) {
        Usuario reportador = usuarioRepository.findByUsername(usernameReportador)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario reportador no encontrado."));

        if (reporteRequest.getReportadoId() == null && reporteRequest.getPostId() == null && reporteRequest.getComentarioId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se debe especificar un usuario, post o comentario a reportar.");
        }

        Usuario reportado = null;
        Post post = null;
        Comentario comentario = null;

        if (reporteRequest.getReportadoId() != null) {
            reportado = usuarioRepository.findById(reporteRequest.getReportadoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario reportado no encontrado."));
        }

        if (reporteRequest.getPostId() != null) {
            post = postRepository.findById(reporteRequest.getPostId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post no encontrado."));
            // Si el reporte es sobre un post y no se especificó un reportadoId, el reportado es el usuario del post
            if (reportado == null) {
                reportado = post.getUsuario(); 
            }
        }

        if (reporteRequest.getComentarioId() != null) {
            comentario = comentarioRepository.findById(reporteRequest.getComentarioId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comentario no encontrado."));
            // Si el reporte es sobre un comentario y no se especificó un reportadoId, el reportado es el usuario del comentario
            if (reportado == null) {
                reportado = comentario.getUsuario(); 
            }
        }

        // Validación adicional: Evitar que un usuario se reporte a sí mismo (si aplica)
        if (reportado != null && reportador.equals(reportado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes reportarte a ti mismo.");
        }

        Reporte nuevoReporte = Reporte.builder()
                .reportador(reportador)
                .reportado(reportado)
                .post(post)
                .comentario(comentario)
                .motivo(reporteRequest.getMotivo())
                .resuelto(false) // Por defecto, el reporte está pendiente
                .fechaReporte(LocalDateTime.now())
                .build();

        Reporte reporteGuardado = reporteRepository.save(nuevoReporte);
        return mapToReporteResponse(reporteGuardado);
    }

    public List<ReporteResponseDTO> obtenerTodosLosReportes() {
        return reporteRepository.findAllByOrderByFechaReporteDesc().stream()
                .map(this::mapToReporteResponse)
                .collect(Collectors.toList());
    }

    public List<ReporteResponseDTO> obtenerReportesPendientes() {
        return reporteRepository.findByResueltoFalseOrderByFechaReporteAsc().stream()
                .map(this::mapToReporteResponse)
                .collect(Collectors.toList());
    }

    public ReporteResponseDTO resolverReporte(Long reporteId) {
        Reporte reporte = reporteRepository.findById(reporteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado."));

        if (reporte.isResuelto()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este reporte ya ha sido marcado como resuelto.");
        }

        reporte.setResuelto(true);
        Reporte reporteActualizado = reporteRepository.save(reporte);
        return mapToReporteResponse(reporteActualizado);
    }

    // Método de mapeo de entidad a DTO
    private ReporteResponseDTO mapToReporteResponse(Reporte reporte) {
        return ReporteResponseDTO.builder()
                .id(reporte.getId())
                .reportadorUsername(reporte.getReportador().getUsername())
                .reportadoUsername(reporte.getReportado() != null ? reporte.getReportado().getUsername() : null)
                .postId(reporte.getPost() != null ? reporte.getPost().getId() : null)
                .postTitulo(reporte.getPost() != null ? reporte.getPost().getTitulo() : null)
                .comentarioId(reporte.getComentario() != null ? reporte.getComentario().getId() : null)
                .comentarioContenido(reporte.getComentario() != null ? reporte.getComentario().getContenido() : null)
                .motivo(reporte.getMotivo())
                .resuelto(reporte.isResuelto())
                .fechaReporte(reporte.getFechaReporte())
                .build();
    }
}
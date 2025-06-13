class ReportesManager {
    constructor() {
        this.reportes = [];
        this.filtroActual = 'all';
        this.init();
    }

    init() {
        this.checkAdminAccess();
        this.setupEventListeners();
        this.cargarReportes();
    }

    checkAdminAccess() {
        const token = localStorage.getItem('authToken');
        const userDataString = localStorage.getItem('userData');

        let isAdmin = false;
        if (userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                isAdmin = userData.roles && userData.roles.includes('ROLE_ADMIN');
            } catch (error) {
                console.error('Error parsing userData:', error);
            }
        }

        if (!token || !isAdmin) {
            window.location.href = 'index.html';
            return;
        }
    }

    setupEventListeners() {
        // Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filtroActual = e.target.dataset.filter;
                this.renderReportes();
            });
        });
    }

    async cargarReportes() {
        const loadingEl = document.getElementById('reports-loading');
        const contentEl = document.getElementById('reports-content');
        const errorEl = document.getElementById('reports-error');

        try {
            loadingEl.style.display = 'block';
            contentEl.style.display = 'none';
            errorEl.style.display = 'none';

            const token = localStorage.getItem('authToken');

            const response = await fetch(`${API_BASE_URL}/api/reportes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            this.reportes = await response.json();
            this.renderReportes();

        } catch (error) {
            console.error('Error completo:', error);
            errorEl.style.display = 'block';
            errorEl.textContent = 'Error al cargar los reportes: ' + error.message;
        } finally {
            loadingEl.style.display = 'none';
            contentEl.style.display = 'block';
        }
    }

    renderReportes() {
        const contentEl = document.getElementById('reports-content');
        const reportesFiltrados = this.filtrarReportes();


        contentEl.innerHTML = reportesFiltrados.map(reporte => this.renderReporte(reporte)).join('');

        // Agregar event listeners a los botones de resolver
        document.querySelectorAll('.btn-resolve').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reporteId = e.target.dataset.reporteId;
                this.resolverReporte(reporteId);
            });
        });
    }

    filtrarReportes() {
        return this.reportes.filter(reporte => {
            switch (this.filtroActual) {
                case 'pendientes':
                    return !reporte.resuelto;
                case 'resueltos':
                    return reporte.resuelto;
                default: // 'all'
                    return true;
            }
        });
    }

    renderReporte(reporte) {
        const tipoReporte = this.getTipoReporte(reporte);
        const fechaFormateada = new Date(reporte.fechaReporte).toLocaleString('es-ES');

        return `
      <div class="report-item">
        <div class="report-header">
          <div class="report-info">
            <div class="report-id">Reporte #${reporte.id}</div>
            <span class="report-type ${tipoReporte.clase}">${tipoReporte.texto}</span>
          </div>
        </div>
        
        <div class="report-details">
          <p><strong>Reportado por:</strong> ${reporte.reportadorUsername}</p>
          ${reporte.reportadoUsername ? `<p><strong>Usuario reportado:</strong> ${reporte.reportadoUsername}</p>` : ''}
          ${reporte.postTitulo ? `<p><strong>Post:</strong> ${reporte.postTitulo}</p>` : ''}
          ${reporte.comentarioContenido ? `<p><strong>Comentario:</strong> ${reporte.comentarioContenido}</p>` : ''}
          
          <div class="report-reason">
            <strong>Motivo:</strong> ${reporte.motivo}
          </div>
          
          <div class="report-date">
            Reportado el: ${fechaFormateada}
          </div>
        </div>
        
        <div class="report-actions">
          ${!reporte.resuelto ?
            `<button class="btn-resolve" data-reporte-id="${reporte.id}">
              Marcar como Resuelto
            </button>` :
            '<span style="color: #86efac; font-weight: 600;">✓ Resuelto</span>'
        }
        </div>
      </div>
    `;
    }

    getTipoReporte(reporte) {
        if (reporte.comentarioId) {
            return { clase: 'comentario', texto: 'Comentario' };
        } else if (reporte.postId) {
            return { clase: 'post', texto: 'Post' };
        } else if (reporte.reportadoUsername) {
            return { clase: 'usuario', texto: 'Usuario' };
        }
        return { clase: 'usuario', texto: 'Desconocido' };
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    async resolverReporte(reporteId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/reportes/${reporteId}/resolver`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            // Actualizar el reporte en la lista local
            const reporteIndex = this.reportes.findIndex(r => r.id == reporteId);
            if (reporteIndex !== -1) {
                this.reportes[reporteIndex].resuelto = true;
            }

            this.renderReportes();

        } catch (error) {
            console.error('Error:', error);
            alert('Error al resolver el reporte: ' + error.message);
        }
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new ReportesManager();
});

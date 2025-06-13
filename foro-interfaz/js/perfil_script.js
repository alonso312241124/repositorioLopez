let authenticatedUserId = null;
let authenticatedUsername = null;

document.addEventListener("DOMContentLoaded", () => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            authenticatedUserId = userData.userId;
            authenticatedUsername = userData.username;
        } catch (e) {
            console.error("Error parsing userData from localStorage:", e);
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const profileUsername = urlParams.get("username");

    if (profileUsername) {
        cargarDetallePerfil(profileUsername);
    } else {
        console.error("No se proporcionó username para el perfil.");
        const perfilContainer = document.getElementById("perfil-usuario-container");
        if (perfilContainer) {
            perfilContainer.innerHTML = '<div class="error-message-perfil">Error: No se especificó un usuario para mostrar el perfil.</div>';
        }
    }

    inicializarModalEditarPerfil();
});

async function cargarDetallePerfil(username) {
    const perfilContainer = document.getElementById("perfil-usuario-container");
    if (!perfilContainer) {
        console.error("cargarDetallePerfil: Elemento #perfil-usuario-container no encontrado en el DOM.");
        return;
    }
    perfilContainer.innerHTML = `
    <div class="loading-perfil">
      <div class="loading-spinner-perfil"></div>
      Cargando perfil de ${username}...
    </div>`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/perfil/${username}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `Error HTTP: ${response.status} - ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const perfil = await response.json();
        renderDetallePerfil(perfil, perfilContainer);
        cargarComentariosDeUsuario(perfil.username);

    } catch (error) {
        console.error("Error al cargar el perfil:", error);
        if (perfilContainer) {
            perfilContainer.innerHTML = `<div class="error-message-perfil">Error al cargar el perfil: ${error.message}.</div>`;
        }
    }
}

async function renderDetallePerfil(perfil, container) {
    if (!container)
        return;
    container.innerHTML = "";
    document.title = `Perfil de ${perfil.username} - InvestForums`;

    const fechaRegistroFormateada = new Date(perfil.fechaRegistro).toLocaleDateString("es-ES", {
        year: "numeric", month: "2-digit", day: "2-digit",
    });

    let fotoPerfil;
    if (perfil.foto && perfil.foto.startsWith('uploads/')) {
        fotoPerfil = `http://localhost:8080/${perfil.foto}`;
    } else if (perfil.foto) {
        fotoPerfil = perfil.foto;
    } else {
        fotoPerfil = "img/placeholder_avatar.png";
    }

    const isAdminProfile = perfil.authorities && perfil.authorities.includes("ROLE_ADMIN");
    const adminTag = isAdminProfile ? '<span class="profile-admin-tag">[ADMIN]</span>' : '';

    const isOwnProfile = (authenticatedUserId && authenticatedUsername && perfil.id === authenticatedUserId) || (perfil.username === authenticatedUsername);

    let profileActionsHtml = '';
    if (isOwnProfile) {
        profileActionsHtml = `
            <div class="profile-actions">
                <button class="btn-primary" id="edit-profile-btn">
                    Editar Perfil <i class="bi bi-pencil-square"></i>
                </button>
                <a href="favoritos.html" class="btn-secondary">
                    Ver Favoritos <i class="bi bi-star-fill"></i>
                </a>
            </div>
        `;
    } else if (authenticatedUserId) {
        const yaDidoReputacion = await verificarReputacionDada(perfil.id);
        profileActionsHtml = `
        <div class="profile-actions">
            <button class="btn-reputation ${yaDidoReputacion ? 'reputation-given' : ''}" 
                    id="give-reputation-btn" 
                    data-user-id="${perfil.id}"
                    ${yaDidoReputacion ? 'disabled' : ''}>
                ${yaDidoReputacion ? 'Ya has dado reputación' : 'Dar Reputación'} 
                <i class="bi bi-star-fill"></i>
            </button>
        </div>`;
    } else {
        profileActionsHtml = `
            <div class="profile-actions">
                <p class="login-message">Inicia sesión para interactuar con este perfil</p>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-header">
                <img src="${fotoPerfil}" alt="Foto de perfil de ${perfil.username}" class="profile-avatar" onerror="this.src='img/placeholder_avatar.png';">
                <div class="profile-title-group">
                    <h1 class="profile-username">${perfil.username} ${adminTag}</h1>
                    <p class="profile-email">${perfil.email}</p>
                </div>
            </div>
            <div class="profile-body">
                <div class="profile-info-item">
                    <i class="bi bi-calendar-check"></i>
                    <span>Registrado:</span> <strong>${fechaRegistroFormateada}</strong>
                </div>
                <div class="profile-info-item">
                    <i class="bi bi-star-fill"></i>
                    <span>Reputación:</span> <strong id="user-reputation">${perfil.reputacion}</strong>
                </div>
            </div>
            ${profileActionsHtml}
        </div>
    `;

    const editProfileBtn = document.getElementById("edit-profile-btn");
    if (editProfileBtn) {
        editProfileBtn.addEventListener("click", abrirModalEditarPerfil);
    }

    const giveReputationBtn = document.getElementById("give-reputation-btn");
    if (giveReputationBtn && !giveReputationBtn.disabled) {
        giveReputationBtn.addEventListener("click", () => darReputacion(perfil.id));
    }

    const userCommentsSection = document.getElementById("user-comments-section");
    const profileUsernameComments = document.getElementById("profile-username-comments");
    if (userCommentsSection && profileUsernameComments) {
        profileUsernameComments.textContent = perfil.username;
        userCommentsSection.style.display = "block";
    }
}

async function verificarReputacionDada(receptorId) {
    if (!authenticatedUserId)
        return false;

    try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${API_BASE_URL}/api/reputacion/verificar/${receptorId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        if (response.ok) {
            return await response.json();
        }
        return false;
    } catch (error) {
        console.error("Error al verificar reputación:", error);
        return false;
    }
}

async function darReputacion(receptorId) {
    const token = localStorage.getItem("authToken");
    if (!token) {
        alert("Debes iniciar sesión para dar reputación");
        return;
    }

    const giveReputationBtn = document.getElementById("give-reputation-btn");
    if (giveReputationBtn) {
        giveReputationBtn.disabled = true;
        giveReputationBtn.innerHTML = 'Dando +1 Reputación... <i class="bi bi-hourglass-split"></i>';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/reputacion`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ receptorId: receptorId })
        });

        if (response.ok) {
            const responseData = await response.json();

            const userReputationElement = document.getElementById("user-reputation");
            if (userReputationElement && responseData.nuevaReputacionTotal) {
                userReputationElement.textContent = responseData.nuevaReputacionTotal;
            } else if (userReputationElement) {
                const currentReputation = parseInt(userReputationElement.textContent);
                userReputationElement.textContent = currentReputation + 1;
            }

            if (giveReputationBtn) {
                giveReputationBtn.innerHTML = '+1 Reputación Dada <i class="bi bi-star-fill"></i>';
                giveReputationBtn.classList.add('reputation-given');
            }

        } else {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || "Error al dar reputación";
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error("Error al dar reputación:", error);
        mostrarMensaje(`Error: ${error.message}`, "error");

        if (giveReputationBtn) {
            giveReputationBtn.disabled = false;
            giveReputationBtn.innerHTML = 'Dar Reputación <i class="bi bi-star-fill"></i>';
        }
    }
}

function mostrarMensaje(mensaje, tipo) {
    const messageElement = document.createElement("div");
    messageElement.className = `message-toast ${tipo}`;
    messageElement.textContent = mensaje;

    messageElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        ${tipo === 'success' ? 'background-color: #10b981;' : 'background-color: #ef4444;'}
    `;

    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.style.animation = "slideOut 0.3s ease";
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 300);
    }, 3000);
}

async function cargarComentariosDeUsuario(username) {
    const userCommentsList = document.getElementById("user-comments-list");
    if (!userCommentsList) {
        console.error("cargarComentariosDeUsuario: Elemento #user-comments-list no encontrado en el DOM.");
        return;
    }

    userCommentsList.innerHTML = `
        <p class="loading-posts">
            <div class="loading-spinner-perfil"></div>
            Cargando comentarios de ${username}...
        </p>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/api/comentarios/usuario/${username}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `Error HTTP: ${response.status} - ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const comentarios = await response.json();
        renderComentariosDeUsuario(comentarios, userCommentsList);

    } catch (error) {
        console.error("Error al cargar los comentarios del usuario:", error);
        userCommentsList.innerHTML = `<p class="error-message-perfil">Error al cargar los comentarios: ${error.message}</p>`;
    }
}

function renderComentariosDeUsuario(comentarios, container) {
    if (!container)
        return;
    container.innerHTML = "";

    if (comentarios.length === 0) {
        container.innerHTML = `<p class="no-content-message">Este usuario aún no ha realizado comentarios.</p>`;
        return;
    }

    comentarios.forEach(comentario => {
        const fechaComentarioFormateada = new Date(comentario.fechaCreacion).toLocaleString("es-ES", {
            year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
        });

        const comentarioElement = document.createElement("div");
        comentarioElement.classList.add("comment-card-small");
        comentarioElement.innerHTML = `
            <div class="comment-header-small">
                <h4>Comentario en: <a href="post_detalle.html?id=${comentario.post.id}">${comentario.post.titulo}</a></h4>
                <span class="comment-date-small">${fechaComentarioFormateada}</span>
            </div>
            <p class="comment-content-small">${comentario.contenido.replace(/\n/g, "<br>")}</p>
        `;
        container.appendChild(comentarioElement);
    });
}

function inicializarModalEditarPerfil() {
    const modal = document.getElementById("edit-profile-dialog");
    if (!modal) {
        console.error("Modal edit-profile-dialog no encontrado");
        return;
    }

    const form = document.getElementById("edit-profile-form");
    const closeBtn = modal.querySelector(".close-dialog-btn");
    const cancelBtn = document.getElementById("cancel-edit-btn");
    const fileInput = document.getElementById("edit-foto");

    // Event listeners para cerrar modal
    closeBtn?.addEventListener("click", () => {
        modal.close();
        limpiarFormularioEdicion();
    });

    cancelBtn?.addEventListener("click", () => {
        modal.close();
        limpiarFormularioEdicion();
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.close();
            limpiarFormularioEdicion();
        }
    });

    // Preview de imagen
    fileInput?.addEventListener("change", mostrarPreviewImagen);

    // Submit del formulario
    form?.addEventListener("submit", manejarEditarPerfil);
}

function mostrarPreviewImagen(e) {
    const file = e.target.files[0];
    const previewContainer = document.getElementById("preview-container");
    const previewImg = document.getElementById("image-preview");

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewContainer.style.display = "block";
        };
        reader.readAsDataURL(file);
    } else {
        previewContainer.style.display = "none";
    }
}

function limpiarFormularioEdicion() {
    const form = document.getElementById("edit-profile-form");
    const messageElement = document.getElementById("edit-profile-message");
    const previewContainer = document.getElementById("preview-container");

    form?.reset();
    if (messageElement) {
        messageElement.textContent = "";
        messageElement.className = "dialog-message";
    }
    if (previewContainer) {
        previewContainer.style.display = "none";
    }
}

function abrirModalEditarPerfil() {
    const modal = document.getElementById("edit-profile-dialog");
    limpiarFormularioEdicion();
    modal.showModal();
}

async function manejarEditarPerfil(e) {
    e.preventDefault();

    const token = localStorage.getItem("authToken");
    if (!token) {
        mostrarMensaje("Debes iniciar sesión", "error");
        return;
    }

    const form = e.target;
    const formData = new FormData();
    const messageElement = document.getElementById("edit-profile-message");
    const submitBtn = form.querySelector('button[type="submit"]');

    // Obtener valores del formulario
    const email = document.getElementById("edit-email").value.trim();
    const password = document.getElementById("edit-password").value.trim();
    const foto = document.getElementById("edit-foto").files[0];

    // Agregar solo los campos que tienen valor
    if (email) formData.append("email", email);
    if (password) formData.append("password", password);
    if (foto) formData.append("foto", foto);

    // Verificar que al menos un campo tenga valor
    if (!email && !password && !foto) {
        messageElement.textContent = "Debes cambiar al menos un campo";
        messageElement.className = "dialog-message error";
        return;
    }

    // Mostrar estado de carga
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";
    messageElement.textContent = "";
    messageElement.className = "dialog-message";

    try {
        const response = await fetch(`${API_BASE_URL}/api/perfil/editar`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            mostrarMensaje("Perfil actualizado correctamente", "success");

            // Actualizar la UI con los nuevos datos
            if (data.perfil) {
                actualizarPerfilEnUI(data.perfil);
            }

            // Cerrar modal
            document.getElementById("edit-profile-dialog").close();
            limpiarFormularioEdicion();

        } else {
            messageElement.textContent = data.message || "Error al actualizar el perfil";
            messageElement.className = "dialog-message error";
        }

    } catch (error) {
        console.error("Error al editar perfil:", error);
        messageElement.textContent = "Error de conexión. Inténtalo de nuevo.";
        messageElement.className = "dialog-message error";
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Guardar Cambios";
    }
}

function actualizarPerfilEnUI(perfil) {
    // Actualizar email
    const emailElement = document.querySelector(".profile-email");
    if (emailElement && perfil.email) {
        emailElement.textContent = perfil.email;
    }

    const avatarElement = document.querySelector(".profile-avatar");
    if (avatarElement && perfil.foto) {
        if (perfil.foto.startsWith('uploads/')) {
            avatarElement.src = `http://localhost:8080/${perfil.foto}`;
        } else {
            avatarElement.src = perfil.foto;
        }
    }
}
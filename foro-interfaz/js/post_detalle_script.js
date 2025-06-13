let currentPostId = null;
let currentPostAuthorId = null; // ID del autor del post actual
let authenticatedUserId = null; // ID del usuario autenticado
let isAuthenticatedAdmin = false; // Indica si el usuario autenticado es admin

const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const editTitleInput = document.getElementById("edit-title");
const editTitleLabel = document.getElementById("edit-title-label");
const editContentTextarea = document.getElementById("edit-content");
const editIdInput = document.getElementById("edit-id");
const editTypeInput = document.getElementById("edit-type");

const confirmModal = document.getElementById("confirm-modal");
const confirmModalTitle = document.getElementById("confirm-modal-title");
const confirmModalMessage = document.getElementById("confirm-modal-message");
const confirmYesBtn = document.getElementById("confirm-yes-btn");
const confirmNoBtn = document.getElementById("confirm-no-btn");

const reportModal = document.getElementById("report-modal");
const reportForm = document.getElementById("report-form");
const reportReasonTextarea = document.getElementById("report-reason");
const reportEntityIdInput = document.getElementById("report-entity-id");
const reportEntityTypeInput = document.getElementById("report-entity-type");

// --- Inicialización de Event Listeners al cargar el DOM ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Carga de datos del usuario autenticado desde localStorage
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            authenticatedUserId = userData.userId;
            isAuthenticatedAdmin =
                userData.authorities && userData.authorities.includes("ROLE_ADMIN");
        } catch (e) {
            console.log(e);
        }
    }

    // 2. Inicialización de la visibilidad de los modales (ocultar por defecto)
    if (editModal) { editModal.style.display = "none"; }
    if (confirmModal) { confirmModal.style.display = "none"; }
    if (reportModal) { reportModal.style.display = "none"; }

    // 3. Configuración de Event Listeners para cerrar modales
    document.querySelectorAll(".close-button").forEach((button) => {
        button.addEventListener("click", (event) => {
            const targetId = event.target.dataset.modalTarget;
            const modalToClose = document.getElementById(targetId);
            if (modalToClose) {
                modalToClose.style.display = "none";
                // Limpiar formulario de reporte al cerrar
                if (modalToClose.id === "report-modal" && reportReasonTextarea) {
                    reportReasonTextarea.value = "";
                }
            }
        });
    });

    window.addEventListener("click", (event) => {
        if (editModal && event.target === editModal) {
            editModal.style.display = "none";
        }
        if (confirmModal && event.target === confirmModal) {
            confirmModal.style.display = "none";
        }
        if (reportModal && event.target === reportModal) {
            reportModal.style.display = "none";
            if (reportReasonTextarea) {
                reportReasonTextarea.value = "";
            }
        }
    });

    // 4. Configuración de Event Listeners para formularios de modales
    if (editForm) { editForm.addEventListener("submit", handleEditSubmit); }
    if (reportForm) { reportForm.addEventListener("submit", handleReportSubmit); }

    // 5. Lógica principal de carga del post si hay ID en la URL
    const urlParams = new URLSearchParams(window.location.search);
    currentPostId = urlParams.get("id");

    if (currentPostId) {
        cargarDetallePost(currentPostId);
        cargarComentarios(currentPostId);
        setupComentarioForm();
    } else {
        const postContainer = document.getElementById("post-detalle-container");
        if (postContainer) {
            postContainer.innerHTML =
                '<div class="error-message-detalle">Error: No se especificó un post.</div>';
        }
        const listaComentariosDiv = document.getElementById("lista-comentarios");
        if (listaComentariosDiv) {
            listaComentariosDiv.innerHTML =
                '<p class="comentario-error-message">Error: No se pueden cargar comentarios sin un post.</p>';
        }
        const comentarioFormArea = document.getElementById("comentario-form-area");
        if (comentarioFormArea) {
            comentarioFormArea.innerHTML = "";
        }
    }
});

//
async function cargarDetallePost(postId) {
    const postContainer = document.getElementById("post-detalle-container");
    if (!postContainer) {
        console.error("Error no container");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/blog/${postId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `Error HTTP: ${response.status} - ${response.statusText}`;
            throw new Error(errorMessage);
        }
        const post = await response.json();
        currentPostAuthorId = post.usuario.id;
        renderDetallePost(post, postContainer); // Post
        setupFavoriteButton(postId); // Boton de favorito
        setupReportButtons(post.id, "post", currentPostAuthorId); // Boton de reporte
    } catch (error) {
        console.error("Error al cargar el detalle del post:", error);
        if (postContainer) {
            postContainer.innerHTML = `<div class="error-message-detalle">Error al cargar el post: ${error.message}.</div>`;
        }
    }
}

function renderDetallePost(post, container) {
    if (!container) return;

    container.innerHTML = "";
    document.title = `${post.titulo} - InvestForums`;

    const fechaPostFormateada = new Date(post.fechaCreacion).toLocaleString(
        "es-ES",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        },
    );
    const fechaRegistroAutorFormateada = new Date(
        post.usuario.fechaRegistro,
    ).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const fotoAutor = construirUrlFoto(post.usuario.foto);

    // Reemplaza los saltos de linea con un <br> para que se vea en el div
    const contenidoHtml = post.contenido.replace(/\n/g, "<br>");

    // Si es admin, añade un tag al lado
    const isAdminPostAuthor =
        post.usuario.authorities &&
        post.usuario.authorities.includes("ROLE_ADMIN");
    const adminTag = isAdminPostAuthor
        ? '<span class="admin-tag">[ADMIN]</span>'
        : "";

    // Comprobar si es el autor del post para poner botones de edición y eliminar
    const canEditDelete =
        authenticatedUserId && parseInt(authenticatedUserId) === post.usuario.id;

    let actionButtonsHtml = "";
    if (canEditDelete) {
        actionButtonsHtml = `
            <div class="post-actions">
                <button class="action-btn edit-btn" data-id="${post.id}" data-type="post" title="Editar post">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${post.id}" data-type="post" title="Eliminar post">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    }

    let imagenesHtml = "";
    if (post.fotos && post.fotos.length > 0) {
        const imagenesTags = post.fotos
            .map((fotoUrl) => {
                const urlCompleta = construirUrlFoto(fotoUrl);
                return `<img src="${urlCompleta}" alt="Imagen del post" class="post-imagen-item" onerror="this.style.display='none'">`;
            })
            .join(""); // Unimos todos los <img> en un solo string

        imagenesHtml = `<div class="post-imagenes-container">${imagenesTags}</div>`;
    }

    container.innerHTML = `
    <div class="post-item-display">
        <div class="post-usuario-columna">
            <img src="${fotoAutor}" class="post-autor-foto" onerror="this.src='img/placeholder_avatar.png';">
            <div class="post-autor-nombre">
                <a href="perfil.html?username=${encodeURIComponent(post.usuario.username,)}" class="profile-link">${post.usuario.username}</a> ${adminTag}
            </div>
            <div class="post-info-extra">
                <p>Registrado: ${fechaRegistroAutorFormateada}</p>
                <p>Reputación: ${post.usuario.reputacion}</p>
            </div>
        </div>
        <div class="post-contenido-columna">
            <div class="post-header-with-actions">
                <h1 class="post-title-in-column">${post.titulo}</h1>
                ${actionButtonsHtml}
                <button class="action-btn report-btn" data-id="${post.id}" data-type="post" data-author-id="${post.usuario.id}" title="Reportar post">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                </button>
            </div>
            <div class="post-meta-info-in-column">
              <span>Subforo: <a href="subforo_hilos.html?id=${post.subforo.id}&nombre=${encodeURIComponent(post.subforo.nombre)}">${post.subforo.nombre}</a></span>
            </div>
            <div class="post-full-content">
              ${contenidoHtml}
            </div>
            
            ${imagenesHtml}

            <div class="post-footer">
              <button id="favorite-post-btn" class="favorite-button" data-post-id="${post.id}">
                <span class="favorite-text">Añadir a favoritos</span>
              </button>
              <span class="post-fecha-bottom">${fechaPostFormateada}</span>
            </div>
        </div>
    </div>
  `;

    if (canEditDelete) {
        const editButton = document.querySelector(
            `.post-actions .edit-btn[data-id="${post.id}"][data-type="post"]`,
        );
        if (editButton) {
            editButton.addEventListener("click", () => openEditPostModal(post));
        }
        const deleteButton = document.querySelector(
            `.post-actions .delete-btn[data-id="${post.id}"][data-type="post"]`,
        );
        if (deleteButton) {
            deleteButton.addEventListener("click", () =>
                handleDeletePost(post.id, post.titulo),
            );
        }
    }
    setupReportButtons(post.id, "post", post.usuario.id);
}

async function setupFavoriteButton(postId) {
    const favoriteButton = document.getElementById("favorite-post-btn");
    if (!favoriteButton) {
        console.error("Elemento no encontrado.");
        return;
    }
    const jwtToken = localStorage.getItem("authToken");

    if (!jwtToken || !authenticatedUserId) {
        favoriteButton.style.display = "none";
        return;
    }

    if (parseInt(authenticatedUserId) === currentPostAuthorId) {
        favoriteButton.style.display = "none";
        return;
    }

    favoriteButton.style.display = "flex";
    await checkFavoriteStatus(postId, favoriteButton, jwtToken);
    favoriteButton.addEventListener("click", () => handleFavoriteToggle(postId, favoriteButton, jwtToken));
}

async function checkFavoriteStatus(postId, button, token) {
    if (!button)
        return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/favoritos/estado/${postId}`, {
            method: "GET", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            throw new Error(`Error ${response.statusText}`);
        }

        const isFavorited = await response.json();
        updateFavoriteButtonUI(button, isFavorited);
    } catch (error) {
        console.error("Error verificando estado:", error);
        updateFavoriteButtonUI(button, false);
    }
}

async function handleFavoriteToggle(postId, button, token) {
    if (!button)
        return;

    button.disabled = true;
    const isCurrentlyFavorited = button.classList.contains("favorited");
    const endpoint = isCurrentlyFavorited ? `${API_BASE_URL}/api/favoritos/${postId}` : `${API_BASE_URL}/api/favoritos/${postId}`;
    const method = isCurrentlyFavorited ? "DELETE" : "POST";

    try {
        const response = await fetch(endpoint, {
            method: method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
            const newStatus = !isCurrentlyFavorited;
            updateFavoriteButtonUI(button, newStatus);
            console.log(`Post ${newStatus ? "marcado" : "eliminado"} de favoritos.`);
        } else {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `Error al ${isCurrentlyFavorited ? "eliminar" : "agregar"} favorito: ${response.status} - ${response.statusText}`;
            showAlertDialog(errorMessage);
            console.error(errorMessage);
        }
    } catch (error) {
        showAlertDialog(`Error de red al ${isCurrentlyFavorited ? "eliminar" : "agregar"} favorito: ${error.message}`);
        console.error("Error de red:", error);
    } finally {
        button.disabled = false;
    }
}

function updateFavoriteButtonUI(button, isFavorited) {
    if (!button) return;
    const textElement = button.querySelector(".favorite-text");
    if (textElement) {
        if (isFavorited) {
            button.classList.add("favorited");
            textElement.textContent = "En favoritos";
        } else {
            button.classList.remove("favorited");
            textElement.textContent = "Añadir a favoritos";
        }
    }
}

async function cargarComentarios(postId) {
    const listaComentariosDiv = document.getElementById("lista-comentarios");
    if (!listaComentariosDiv) {
        console.error("error DOM");
        return;
    }
    listaComentariosDiv.innerHTML = `
    <p class="comentario-loading">
        <div class="loading-spinner-detalle"></div>
        Cargando comentarios...
    </p>`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/comentarios/post/${postId}`, {
            method: "GET", headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
            if (response.status === 404) {
                listaComentariosDiv.innerHTML = `<p class="comentario-error-message">Este post no existe o no se pueden cargar sus comentarios.</p>`;
            } else {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.message || `Error HTTP: ${response.status} - ${response.statusText}`;
                throw new Error(errorMessage);
            }
            return;
        }
        const comentarios = await response.json();
        renderComentarios(comentarios, listaComentariosDiv);
    } catch (error) {
        console.error("Error al cargar los comentarios:", error);
        if (listaComentariosDiv) {
            listaComentariosDiv.innerHTML = `<p class="comentario-error-message">Error al cargar los comentarios: ${error.message}.</p>`;
        }
    }
}

function construirUrlFoto(foto) {
    if (foto && foto.startsWith('uploads/')) {
        return `http://localhost:8080/${foto}`;
    } else if (foto && foto.trim() !== '') {
        return foto;
    } else {
        return 'img/placeholder_avatar.png';
    }
}

function renderComentarios(comentarios, container) {
    if (!container) return;
    container.innerHTML = "";
    if (comentarios.length === 0) {
        container.innerHTML = "<p>Sé el primero en comentar.</p>";
        return;
    }

    comentarios.forEach((comentario) => {
        const fechaComentarioFormateada = new Date(comentario.fechaCreacion).toLocaleString("es-ES", {
            year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
        });
        const fechaRegistroUsuarioFormateada = new Date(comentario.usuario.fechaRegistro).toLocaleDateString("es-ES", {
            year: "numeric", month: "2-digit", day: "2-digit",
        });
        const fotoAutorComentario = construirUrlFoto(comentario.usuario.foto);

        const isAdminComentarioAuthor = comentario.usuario.authorities && comentario.usuario.authorities.includes("ROLE_ADMIN");
        const adminTag = isAdminComentarioAuthor ? '<span class="admin-tag">[ADMIN]</span>' : "";
        const canEditDeleteComentario = (authenticatedUserId && parseInt(authenticatedUserId) === comentario.usuario.id) || isAuthenticatedAdmin;

        let comentarioActionButtonsHtml = "";
        if (canEditDeleteComentario) {
            comentarioActionButtonsHtml = `
                <div class="comentario-actions">
                    <button class="action-btn edit-btn" data-id="${comentario.id}" data-type="comentario" title="Editar comentario">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${comentario.id}" data-type="comentario" title="Eliminar comentario">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
        }

        const comentarioElement = document.createElement("div");
        comentarioElement.classList.add("comentario-item");
        comentarioElement.dataset.id = comentario.id;

        comentarioElement.innerHTML = `
            <div class="comentario-usuario-columna">
                <img src="${fotoAutorComentario}" alt="Foto de ${comentario.usuario.username}" class="comentario-autor-foto" onerror="this.src='img/placeholder_avatar.png';">
                <div class="comentario-autor-nombre">
                    <a href="perfil.html?username=${encodeURIComponent(comentario.usuario.username)}" class="profile-link">${comentario.usuario.username}</a> ${adminTag}
                </div>
                <div class="comentario-info-extra">
                    <p>Registrado: ${fechaRegistroUsuarioFormateada}</p>
                    <p>Reputación: ${comentario.usuario.reputacion}</p>
                </div>
            </div>
            <div class="comentario-contenido-columna">
                <div class="comentario-header-with-actions">
                    <p class="comentario-texto">${comentario.contenido.replace(/\n/g, "<br>")}</p>
                    ${comentarioActionButtonsHtml}
                </div>
                <div class="comentario-footer-with-report">
                    <button class="action-btn report-btn-comentario" data-id="${comentario.id}" data-type="comentario" data-author-id="${comentario.usuario.id}" title="Reportar comentario">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                    </button>
                    <div class="comentario-fecha-wrapper">
                        <span class="comentario-fecha">${fechaComentarioFormateada}</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(comentarioElement);

        if (canEditDeleteComentario) {
            const editBtn = comentarioElement.querySelector(`.edit-btn[data-type="comentario"]`);
            if (editBtn) { editBtn.addEventListener("click", () => openEditComentarioModal(comentario)); }
            const deleteBtn = comentarioElement.querySelector(`.delete-btn[data-type="comentario"]`);
            if (deleteBtn) { deleteBtn.addEventListener("click", () => handleDeleteComentario(comentario.id)); }
        }
        setupReportButtons(comentario.id, "comentario", comentario.usuario.id); // Configurar botón de reporte
    });
}

function setupComentarioForm() {
    const comentarioFormArea = document.getElementById("comentario-form-area");
    if (!comentarioFormArea) {
        console.error("error dom comentarios");
        return;
    }
    const jwtToken = localStorage.getItem("authToken");

    if (!jwtToken || !authenticatedUserId) {
        comentarioFormArea.innerHTML = `
            <div class="auth-message">
                Debes iniciar sesión para dejar un comentario.
            </div>
        `;
        return;
    }

    comentarioFormArea.innerHTML = `
        <form id="form-comentar">
            <h3>Deja un comentario</h3>
            <div class="form-group">
                <label for="comentario-textarea" style="display:none;">Tu comentario:</label>
                <textarea id="comentario-textarea" placeholder="Escribe tu comentario..." rows="4" required></textarea>
            </div>
            <button type="submit" class="btn-submit">Enviar Comentario</button>
        </form>
    `;

    const formComentar = document.getElementById("form-comentar");
    if (formComentar) {
        formComentar.addEventListener("submit", (event) =>
            handleComentarioSubmit(event, formComentar),
        );
    }
}

async function handleComentarioSubmit(event, formComentar) {
    event.preventDefault();

    const textarea = formComentar.querySelector("#comentario-textarea");
    const contenido = textarea.value.trim();

    if (!contenido) {
        showAlertDialog("El comentario no puede estar vacío.");
        return;
    }
    if (!currentPostId) {
        showAlertDialog("Error: ID del post no disponible para comentar.");
        return;
    }
    const jwtToken = localStorage.getItem("authToken");
    if (!jwtToken) {
        showAlertDialog("Necesitas iniciar sesión para comentar.");
        return;
    }

    const submitButton = formComentar.querySelector('button[type="submit"]');
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Enviando..."; }
    if (textarea) { textarea.disabled = true; }

    try {
        const response = await fetch(`${API_BASE_URL}/api/comentarios`, {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
            body: JSON.stringify({ postId: currentPostId, contenido: contenido }),
        });

        if (submitButton) { submitButton.disabled = false; submitButton.textContent = "Enviar Comentario"; }
        if (textarea) { textarea.disabled = false; }

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `Error al enviar comentario: ${response.status} - ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const nuevoComentario = await response.json();
        console.log("Comentario enviado:", nuevoComentario);
        if (textarea) { textarea.value = ""; }
        cargarComentarios(currentPostId);
    } catch (error) {
        console.error("Error al enviar el comentario:", error);
        showAlertDialog(`No se pudo enviar el comentario: ${error.message}`);
        // Botones y textarea ya se resetean en finally
    } finally {
        if (submitButton) { submitButton.disabled = false; submitButton.textContent = "Enviar Comentario"; }
        if (textarea) { textarea.disabled = false; }
    }
}

function showConfirmModal(title, message, yesButtonText = "Sí", noButtonText = "No") {
    return new Promise((resolve) => {
        if (!confirmModal || !confirmModalTitle || !confirmModalMessage || !confirmYesBtn || !confirmNoBtn) {
            console.error("Elementos del dom de confirmación no encontrados");
            resolve(window.confirm(message));
            return;
        }

        confirmModalTitle.textContent = title;
        confirmModalMessage.textContent = message;
        confirmYesBtn.textContent = yesButtonText;

        // Ocultar el botón "No" si no se proporciona texto o está vacío
        if (!noButtonText || noButtonText.trim() === "") {
            confirmNoBtn.style.display = "none";
        } else {
            confirmNoBtn.style.display = "inline-block";
            confirmNoBtn.textContent = noButtonText;
        }

        confirmModal.style.display = "flex";

        const handleYes = () => {
            confirmModal.style.display = "none";
            // Restaurar el botón para futuros usos
            confirmNoBtn.style.display = "inline-block";
            resolve(true);
            cleanupConfirmListeners(handleYes, handleNo, handleEscape);
        };
        const handleNo = () => {
            confirmModal.style.display = "none";
            resolve(false);
            cleanupConfirmListeners(handleYes, handleNo, handleEscape);
        };
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                confirmModal.style.display = "none";
                confirmNoBtn.style.display = "inline-block";
                resolve(false);
                cleanupConfirmListeners(handleYes, handleNo, handleEscape);
            }
        };

        cleanupConfirmListeners(handleYes, handleNo, handleEscape); // Limpiar y añadir para evitar duplicados
        confirmYesBtn.addEventListener("click", handleYes);

        // Solo agregar el listener si el botón está visible
        if (noButtonText && noButtonText.trim() !== "") {
            confirmNoBtn.addEventListener("click", handleNo);
        }

        document.addEventListener("keydown", handleEscape);
    });
}

function cleanupConfirmListeners(handleYes, handleNo, handleEscape) {
    if (confirmYesBtn)
        confirmYesBtn.removeEventListener("click", handleYes);

    if (confirmNoBtn)
        confirmNoBtn.removeEventListener("click", handleNo);
    document.removeEventListener("keydown", handleEscape);
}

function showAlertDialog(message) {
    return showConfirmModal("Atención", message, "Aceptar", "").then(() => {});
}

function openEditPostModal(post) {
    if (!editModal || !editTitleInput || !editTitleLabel || !editContentTextarea || !editIdInput || !editTypeInput) {
        console.error("error elementos del modal no encontrados. edit post");
        showAlertDialog("No se pudo abrir el formulario de edición.");
        return;
    }
    editTitleInput.value = post.titulo;
    editTitleInput.style.display = "block";
    editTitleLabel.style.display = "block";
    editContentTextarea.value = post.contenido;
    editIdInput.value = post.id;
    editTypeInput.value = "post";
    editModal.style.display = "flex";
}

function openEditComentarioModal(comentario) {
    if (!editModal || !editTitleInput || !editTitleLabel || !editContentTextarea || !editIdInput || !editTypeInput) {
        console.error("error elementos del modal no encontrados. edit comentario");
        showAlertDialog("No se pudo abrir el formulario de edición.");
        return;
    }
    editTitleInput.value = "";
    editTitleInput.style.display = "none";
    editTitleLabel.style.display = "none";
    editContentTextarea.value = comentario.contenido;
    editIdInput.value = comentario.id;
    editTypeInput.value = "comentario";
    editModal.style.display = "flex";
}

async function handleEditSubmit(event) {
    event.preventDefault();

    if (!editIdInput || !editTypeInput || !editContentTextarea || !editTitleInput) {
        console.error("formulario de edición no encontrado.");
        showAlertDialog("Error: No se pudo procesar la edición.");
        return;
    }
    const id = editIdInput.value;
    const type = editTypeInput.value;
    const jwtToken = localStorage.getItem("authToken");

    if (!jwtToken) {
        showAlertDialog("Necesitas iniciar sesión para editar.");
        return;
    }

    let url;
    let data;

    if (type === "post") {
        const titulo = editTitleInput.value.trim();
        const contenido = editContentTextarea.value.trim();
        if (!titulo || !contenido) {
            showAlertDialog("El título y el contenido del post no pueden estar vacíos.");
            return;
        }
        url = `${API_BASE_URL}/api/blog/${id}`;
        try {
            const postDataResponse = await fetch(`${API_BASE_URL}/api/blog/${id}`);
            if (!postDataResponse.ok) throw new Error("No se pudo obtener el subforoId del post.");
            const postData = await postDataResponse.json();
            data = { titulo, contenido, subforoId: postData.subforo.id };
        } catch (error) {
            console.error("Error al obtener subforoId para la edición del post:", error);
            showAlertDialog("No se pudo editar el post: error al obtener información adicional. " + error.message); return;
        }
    } else if (type === "comentario") {
        const contenido = editContentTextarea.value.trim();
        if (!contenido) {
            showAlertDialog("El contenido del comentario no puede estar vacío.");
            return;
        }

        url = `${API_BASE_URL}/api/comentarios/${id}`;
        data = { postId: currentPostId, contenido };
    } else {
        showAlertDialog("Tipo de edición desconocido.");
        return;
    }

    try {
        const response = await fetch(url, {
            method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `Error al editar ${type}: ${response.status} - ${response.statusText}`;
            throw new Error(errorMessage);
        }
        if (editModal) {
            editModal.style.display = "none";
        }
        if (type === "post") {
            cargarDetallePost(currentPostId);
        } else {
            cargarComentarios(currentPostId);
        }
    } catch (error) {
        console.error(`Error al editar `, error);
        showAlertDialog(`No se pudo editar el ${type}: ${error.message}`);
    }
}

async function handleDeletePost(postId, postTitle) {
    const confirmed = await showConfirmModal(
        "Confirmar Eliminación", `¿Estás seguro de que quieres eliminar el post "${postTitle}"? Esta acción es irreversible.`, "Sí, Eliminar", "Cancelar",
    );
    if (!confirmed) {
        return;
    }
    const jwtToken = localStorage.getItem("authToken");
    if (!jwtToken) {
        showAlertDialog("Necesitas iniciar sesión para eliminar posts.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/blog/${postId}`, {
            method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
        });
        if (response.ok) { window.location.href = "index.html"; } else {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `Error al eliminar post: ${response.status} - ${response.statusText}`;
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error("Error al eliminar el post:", error);
        showAlertDialog(`No se pudo eliminar el post: ${error.message}`);
    }
}

async function handleDeleteComentario(comentarioId) {
    const confirmed = await showConfirmModal(
        "Confirmar Eliminación", "¿Estás seguro de que quieres eliminar este comentario? Esta acción es irreversible.", "Sí, Eliminar", "Cancelar",
    );
    if (!confirmed) {
        return;
    }
    const jwtToken = localStorage.getItem("authToken");
    if (!jwtToken) {
        showAlertDialog("Necesitas iniciar sesión para eliminar comentarios.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/comentarios/${comentarioId}`, {
            method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
        });
        if (response.ok) { cargarComentarios(currentPostId); } else {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `Error al eliminar comentario: ${response.status} - ${response.statusText}`;
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.log("Error :", error);
        showAlertDialog(`No se pudo eliminar el comentario: ${error.message}`);
    }
}


function setupReportButtons(entityId, entityType, entityAuthorId) {
    const jwtToken = localStorage.getItem("authToken");

    // Buscar el botón específico para esta entidad
    let reportButton;
    if (entityType === "post") {
        reportButton = document.querySelector(`.report-btn[data-id="${entityId}"][data-type="post"]`);
    } else if (entityType === "comentario") {
        reportButton = document.querySelector(`.report-btn-comentario[data-id="${entityId}"][data-type="comentario"]`);
    }

    if (!reportButton) {
        console.warn(`setupReportButtons: Botón de reporte para ${entityType} con ID ${entityId} no encontrado.`);
        return;
    }

    // Si no hay token o usuario autenticado, ocultar este botón específico
    if (!jwtToken || !authenticatedUserId) {
        reportButton.style.display = "none";
        return;
    }

    // Ocultar botón si el usuario autenticado es el autor del post/comentario
    if (parseInt(authenticatedUserId) === entityAuthorId) {
        reportButton.style.display = "none";
        return;
    }

    // Mostrar el botón si pasa todas las validaciones
    reportButton.style.display = "flex";

    // Remover listener previo para evitar duplicados
    const newClickHandler = () => openReportModal(entityId, entityType);
    reportButton.removeEventListener("click", newClickHandler);
    reportButton.addEventListener("click", newClickHandler);
}

function openReportModal(entityId, entityType) {
    if (!reportModal || !reportEntityIdInput || !reportEntityTypeInput || !reportReasonTextarea) {
        showAlertDialog("Error interno: No se pudo abrir el formulario de reporte.");
        return;
    }
    reportEntityIdInput.value = entityId;
    reportEntityTypeInput.value = entityType;
    reportReasonTextarea.value = ""; // Limpiar el campo de motivo
    reportModal.style.display = "flex"; // Mostrar el modal
}

async function handleReportSubmit(event) {
    event.preventDefault();

    if (!reportEntityIdInput || !reportEntityTypeInput || !reportReasonTextarea) {
        showAlertDialog("Error interno: No se pudo procesar el reporte.");
        return;
    }

    const entityId = reportEntityIdInput.value;
    const entityType = reportEntityTypeInput.value;
    const motivo = reportReasonTextarea.value.trim();
    const jwtToken = localStorage.getItem("authToken");

    if (!motivo) {
        showAlertDialog("El motivo del reporte no puede estar vacío.");
        return;
    }
    if (!jwtToken) {
        showAlertDialog("Necesitas iniciar sesión para reportar.");
        return;
    }

    let reportPayload = { motivo: motivo };
    if (entityType === "post") {
        reportPayload.postId = parseInt(entityId);
    } else if (entityType === "comentario") {
        reportPayload.comentarioId = parseInt(entityId);
    } else {
        showAlertDialog("Tipo de entidad de reporte desconocido.");
        return;
    }

    const submitButton = reportForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Enviando Reporte...";
    }
    if (reportReasonTextarea) {
        reportReasonTextarea.disabled = true;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/reportes`, {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
            body: JSON.stringify(reportPayload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `Error al enviar el reporte: ${response.status} - ${response.statusText}`;
            throw new Error(errorMessage);
        }

        if (reportModal) {
            reportModal.style.display = "none";
        }
        showAlertDialog(`Reporte enviado con éxito. Gracias por tu contribución.`);
        if (reportReasonTextarea) {
            reportReasonTextarea.value = "";
        }
    } catch (error) {
        showAlertDialog(`No se pudo enviar el reporte: ${error.message}`);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Enviar Reporte";
        }
        if (reportReasonTextarea) {
            reportReasonTextarea.disabled = false;
        }
    }
}
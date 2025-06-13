let authenticatedUserId = null;
let isAuthenticatedAdmin = false;
let currentSubforoId = null;

function showAlertDialog(message) {
    alert(message);
}

document.addEventListener("DOMContentLoaded", () => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            authenticatedUserId = userData.userId;
            isAuthenticatedAdmin =
                userData.authorities && userData.authorities.includes("ROLE_ADMIN");
        } catch (e) {
            console.error("Error:", e);
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    currentSubforoId = urlParams.get("id");
    const subforoNombre = urlParams.get("nombre");

    if (subforoNombre) {
        const subforoDescriptionPlaceholder = document.getElementById("subforo-description-placeholder");
        if (subforoDescriptionPlaceholder) {
            subforoDescriptionPlaceholder.textContent = `Hilos del Subforo: ${decodeURIComponent(subforoNombre)}`;
            document.title = `${decodeURIComponent(subforoNombre)} - InvestForums`;
        }
    }

    if (currentSubforoId) {
        cargarHilosDeSubforo(currentSubforoId);
    } else {
        const hilosListaDiv = document.getElementById("hilos-lista");
        if (hilosListaDiv) {
            hilosListaDiv.innerHTML = '<p class="error-message">Error: No se especificó un subforo para mostrar hilos.</p>';
        }
        console.error("No se proporcionó ID de subforo en la URL.");
    }

    setupCrearPostForm();
    setupToggleCrearPost();
    setupImagePreview();
});

async function cargarHilosDeSubforo(subforoId) {
    const hilosListaDiv = document.getElementById("hilos-lista");
    if (!hilosListaDiv) {
        console.error("cargarHilosDeSubforo: Elemento #hilos-lista no encontrado en el DOM.");
        return;
    }

    hilosListaDiv.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            Cargando hilos...
        </div>`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/blog?subforoId=${subforoId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `Error HTTP: ${response.status} - ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const hilos = await response.json();
        renderHilos(hilos, hilosListaDiv);
    } catch (error) {
        console.error("Error al cargar los hilos del subforo:", error);
        hilosListaDiv.innerHTML = `<p class="error-message">Error al cargar los hilos: ${error.message}.</p>`;
    }
}

function renderHilos(hilos, container) {
    container.innerHTML = "";

    if (hilos.length === 0) {
        container.innerHTML =
            "<p>No hay hilos en este subforo todavía. ¡Crea el primero!</p>";
        return;
    }

    hilos.forEach((hilo) => {
        const fechaCreacionFormateada = new Date(hilo.fechaCreacion).toLocaleString(
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

        const fotoAutor = hilo.usuario.foto
            ? (hilo.usuario.foto.startsWith('uploads/')
                ? `/${hilo.usuario.foto}`
                : hilo.usuario.foto)
            : "img/placeholder_avatar.png";

        const isAdminAuthor =
            hilo.usuario.authorities &&
            hilo.usuario.authorities.includes("ROLE_ADMIN");
        const adminTag = isAdminAuthor ? '<span class="admin-tag">[ADMIN]</span>' : "";

        const hiloElement = document.createElement("div");
        hiloElement.classList.add("post-card");
        hiloElement.innerHTML = `
            <div class="post-content">
                <h3 class="post-title">${hilo.titulo}</h3>
                <div class="post-divider"></div>
                <div class="post-meta">
                    <div class="post-author-info">
                        <span class="created-by-text">Creado por</span>
                        <img src="${fotoAutor}" alt="Foto de ${hilo.usuario.username}" class="author-avatar" onerror="this.src='img/placeholder_avatar.png';">
                        <span class="author-name">
                            <a href="perfil.html?username=${encodeURIComponent(hilo.usuario.username)}" class="profile-link">${hilo.usuario.username}</a> ${adminTag}
                        </span>
                    </div>
                    <span class="post-date">${fechaCreacionFormateada}</span>
                </div>
            </div>
        `;

        hiloElement.addEventListener("click", () => {
            window.location.href = `post_detalle.html?id=${hilo.id}`;
        });

        container.appendChild(hiloElement);
    });
}

function setupToggleCrearPost() {
    const btnMostrarCrearPost = document.getElementById("btn-mostrar-crear-post");
    const crearPostSeccion = document.getElementById("crear-post-seccion");

    if (btnMostrarCrearPost && crearPostSeccion) {
        btnMostrarCrearPost.addEventListener("click", () => {
            if (crearPostSeccion.style.display === "none" || crearPostSeccion.style.display === "") {
                crearPostSeccion.style.display = "block";
                btnMostrarCrearPost.textContent = "Ocultar Formulario";
            } else {
                crearPostSeccion.style.display = "none";
                btnMostrarCrearPost.textContent = "Crear Nuevo Post";
            }
        });
    }
}

function setupCrearPostForm() {
    const formCrearPost = document.getElementById("form-crear-post");
    if (!formCrearPost) {
        console.warn("Formulario para crear post no encontrado.");
        return;
    }

    formCrearPost.addEventListener("submit", handleCrearPostSubmit);
}

function setupImagePreview() {
    const imageInput = document.getElementById("post-imagenes");
    if (imageInput) {
        imageInput.addEventListener("change", function(e) {
            const previewContainer = document.getElementById("preview-imagenes");
            if (!previewContainer) return;

            previewContainer.innerHTML = "";

            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const reader = new FileReader();

                reader.onload = function(e) {
                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.style.maxWidth = "100px";
                    img.style.maxHeight = "100px";
                    img.style.margin = "5px";
                    img.style.objectFit = "cover";
                    img.style.borderRadius = "4px";
                    previewContainer.appendChild(img);
                };

                reader.readAsDataURL(file);
            }
        });
    }
}

async function handleCrearPostSubmit(event) {
    event.preventDefault();

    const tituloInput = document.getElementById("post-titulo");
    const contenidoTextarea = document.getElementById("post-contenido");
    const imagenesInput = document.getElementById("post-imagenes");
    const feedbackDiv = document.getElementById("crear-post-feedback");
    const submitButton = document.querySelector('#form-crear-post button[type="submit"]');

    const titulo = tituloInput.value.trim();
    const contenido = contenidoTextarea.value.trim();

    if (!titulo || !contenido) {
        if (feedbackDiv) feedbackDiv.textContent = "El título y el contenido no pueden estar vacíos.";
        return;
    }

    if (!currentSubforoId) {
        if (feedbackDiv) feedbackDiv.textContent = "Error: No se puede crear un post sin un subforo asociado.";
        console.error("currentSubforoId es null. No se puede crear el post.");
        return;
    }

    const jwtToken = localStorage.getItem("authToken");
    if (!jwtToken) {
        showAlertDialog("Necesitas iniciar sesión para crear posts.");
        return;
    }

    if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Publicando..."; }
    if (tituloInput) tituloInput.disabled = true;
    if (contenidoTextarea) contenidoTextarea.disabled = true;

    try {
        let response;

        // Verificar si hay imágenes
        const hasImages = imagenesInput && imagenesInput.files.length > 0;

        if (hasImages) {
            // Usar endpoint multipart para imágenes
            const formData = new FormData();
            formData.append('titulo', titulo);
            formData.append('contenido', contenido);
            formData.append('subforoId', currentSubforoId);

            for (let i = 0; i < imagenesInput.files.length; i++) {
                formData.append('imagenes', imagenesInput.files[i]);
            }

            response = await fetch(`${API_BASE_URL}/api/blog/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                    // NO incluir Content-Type para FormData
                },
                body: formData
            });
        } else {
            // Usar endpoint JSON para posts sin imágenes
            response = await fetch(`${API_BASE_URL}/api/blog`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwtToken}`,
                },
                body: JSON.stringify({
                    titulo: titulo,
                    contenido: contenido,
                    subforoId: parseInt(currentSubforoId)
                }),
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || `Error al crear post: ${response.status} - ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const nuevoPost = await response.json();
        console.log("Post creado:", nuevoPost);

        // Limpiar formulario
        if (tituloInput) tituloInput.value = "";
        if (contenidoTextarea) contenidoTextarea.value = "";
        if (imagenesInput) imagenesInput.value = "";
        const previewContainer = document.getElementById("preview-imagenes");
        if (previewContainer) previewContainer.innerHTML = "";

        if (feedbackDiv) feedbackDiv.textContent = "Post creado con éxito.";

        cargarHilosDeSubforo(currentSubforoId);

        const crearPostSeccion = document.getElementById("crear-post-seccion");
        const btnMostrarCrearPost = document.getElementById("btn-mostrar-crear-post");
        if (crearPostSeccion && btnMostrarCrearPost) {
            crearPostSeccion.style.display = 'none';
            btnMostrarCrearPost.textContent = 'Crear Nuevo Post';
        }

    } catch (error) {
        console.error("Error al crear el post:", error);
        showAlertDialog(`No se pudo crear el post: ${error.message}`);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Publicar Post";
        }
        if (tituloInput) tituloInput.disabled = false;
        if (contenidoTextarea) contenidoTextarea.disabled = false;
    }
}
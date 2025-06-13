document.addEventListener("DOMContentLoaded", () => {
    const favoritosListContainer = document.getElementById("favoritos-list");
    const loadingDiv = document.getElementById("loading-favoritos");
    const errorDiv = document.getElementById("error-favoritos");

    const fetchFavoritos = async () => {
        // El token se obtiene de localStorage, gestionado por auth.js
        const token = localStorage.getItem("authToken");

        // Si no hay token, el usuario no está logueado
        if (!token) {
            loadingDiv.style.display = "none";
            favoritosListContainer.innerHTML = `
        <div class="empty-favoritos-message">
            <h3>Acceso Denegado</h3>
            <p>Debes iniciar sesión para ver tus posts favoritos.</p>
        </div>
      `;
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/favoritos`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    message: `Error HTTP ${response.status}`,
                }));
                throw new Error(
                    errorData.message || "No se pudieron cargar los favoritos."
                );
            }

            const posts = await response.json();
            displayFavoritos(posts);
        } catch (error) {
            errorDiv.textContent = `Error: ${error.message}`;
            errorDiv.style.display = "block";
        } finally {
            loadingDiv.style.display = "none";
        }
    };

    const displayFavoritos = (posts) => {
        favoritosListContainer.innerHTML = ""; // Limpiar por si acaso

        if (posts.length === 0) {
            favoritosListContainer.innerHTML = `
        <div class="empty-favoritos-message">
            <h3>No tienes posts favoritos</h3>
            <p>Puedes marcar un post como favorito desde su página de detalle.</p>
        </div>
      `;
            return;
        }

        posts.forEach((post) => {
            const postCard = document.createElement("div");
            postCard.className = "favorito-post-card";

            const fecha = new Date(post.fechaCreacion).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            // El enlace lleva al detalle del post
            postCard.innerHTML = `
        <a href="post_detalle.html?id=${post.id}" class="favorito-post-titulo">${post.titulo}</a>
        <div class="favorito-post-meta">
            Publicado por <span class="autor">${post.autorUsername}</span> el ${fecha}
        </div>
      `;
            favoritosListContainer.appendChild(postCard);
        });
    };

    // Iniciar la carga de datos al entrar en la página
    fetchFavoritos();
});
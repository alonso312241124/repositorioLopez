async function loadSubforos() {
    const container = document.getElementById("subforos-content");
    if (!container) {
        console.error("Contenedor 'subforos-content' no encontrado.");
        return;
    }

    container.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          Cargando subforos...
        </div>`;

    try {
        console.log(
            "Intentando cargar subforos desde:",
            `${API_BASE_URL}/api/subforos`,
        );

        const response = await fetch(`${API_BASE_URL}/api/subforos`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorBody = await response
                .text()
                .catch(() => "No hay más detalles");
            throw new Error(
                `HTTP error! status: ${response.status} - ${response.statusText}. Detalles: ${errorBody}`,
            );
        }

        const subforos = await response.json();
        console.log("Subforos cargados exitosamente:", subforos);

        renderSubforos(subforos);
    } catch (error) {
        console.error("Error loading subforos:", error);
        container.innerHTML = `
            <div class="error">
                ❌ Error al cargar los subforos<br>
                <small>Error: ${error.message}</small><br>
                <small>Verifica que el servidor esté ejecutándose y que la ruta <code>${API_BASE_URL}/api/subforos</code> sea correcta.</small><br>
                <button class="retry-button" onclick="retryLoad()">Reintentar</button>
            </div>
        `;
    }
}

function renderSubforos(subforos) {
    const container = document.getElementById("subforos-content");
    if (!container) return;

    if (!subforos || subforos.length === 0) {
        container.innerHTML = `
            <div class="placeholder-content">
                📭 No hay subforos disponibles<br>
                <small>Crea el primer subforo para comenzar</small>
            </div>
        `;
        return;
    }

    const subforosList = document.createElement("div");
    subforosList.className = "subforos-list";

    subforos.forEach((subforo) => {
        const subforoCard = createSubforoCard(subforo);
        subforosList.appendChild(subforoCard);
    });

    container.innerHTML = ""; // Limpia el contenido antes de añadir la lista
    container.appendChild(subforosList);
}

function createSubforoCard(subforo) {
    const card = document.createElement("div");
    card.className = "subforo-card";
    card.addEventListener("click", () => handleSubforoClick(subforo));

    const nombreSubforo = subforo.nombre || "Subforo sin nombre";
    const inicial = nombreSubforo.charAt(0).toUpperCase();

    let iconContentHtml;
    if (subforo.imagen && typeof subforo.imagen === "string" && subforo.imagen.trim() !== "") {
        const altText = nombreSubforo.replace(/"/g, "&quot;");
        const fallbackInitialJs = inicial.replace(/'/g, "\\'");

        iconContentHtml = `<img src="../img/${subforo.imagen}" alt="${altText}" class="subforo-image-tag" onerror="this.style.display='none'; const fallbackTextNode = document.createTextNode('${fallbackInitialJs}'); this.parentNode.appendChild(fallbackTextNode); this.parentNode.classList.add('icon-text-fallback');">`;
    } else {
        iconContentHtml = inicial;
    }

    const descripcion = subforo.descripcion || "Discusiones generales sobre este tema."; 

    card.innerHTML = `
        <div class="subforo-header">
            <div class="subforo-icon ${
        !subforo.imagen || subforo.imagen.trim() === ""
            ? "icon-text-default"
            : ""
    }">
                ${iconContentHtml}
            </div>
            <div class="subforo-details">
                <div class="subforo-name">${nombreSubforo}</div>
                <div class="subforo-description">
                    ${descripcion}
                </div>
            </div>
        </div>
    `;
    return card;
}

function handleSubforoClick(subforo) {
    console.log("Clicked subforo:", subforo);
    if (subforo.id) {
        window.location.href = `subforo_hilos.html?id=${subforo.id}&nombre=${encodeURIComponent(subforo.nombre || "")}`;
    } else {
        console.warn("Subforo clickeado no tiene un ID:", subforo);
    }
}


function retryLoad() {
    const container = document.getElementById("subforos-content");
    if (!container) return;

    container.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          Reintentando conexión...
        </div>
    `;
    setTimeout(() => {
        loadSubforos();
    }, 1000);
}


function toggleModerationSection() {
    const userDataString = localStorage.getItem("userData");
    let isAdmin = false;

    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            isAdmin = userData.roles && userData.roles.includes("ROLE_ADMIN");
        } catch (error) {
            console.error("Error parsing userData from localStorage:", error);
        }
    }

    const moderationSection = document.getElementById("moderation-section");
    if (moderationSection) {
        if (isAdmin) {
            moderationSection.style.display = "block";
            console.log("✅ Mostrando sección de moderación");

            const viewReportsBtn = document.getElementById("view-reports-btn");
            if (viewReportsBtn && !viewReportsBtn.hasAttribute("data-listener-added")) {
                viewReportsBtn.addEventListener("click", () => {
                    console.log("Navegando a reportes.html");
                    window.location.href = "reportes.html";
                });
                viewReportsBtn.setAttribute("data-listener-added", "true");
                console.log("✅ Event listener agregado al botón de reportes");
            }
        } else {
            moderationSection.style.display = "none";
            console.log("❌ Ocultando sección de moderación (no es admin)");
        }
    } else {
        console.log("❌ No se encontró el elemento 'moderation-section'.");
    }
}

// Inicialización
document.addEventListener("DOMContentLoaded", function () {
    console.log("app.js inicializado.");
    loadSubforos();

    document.addEventListener("click", function (e) {
        if (e.target && e.target.classList.contains("retry-button")) {
            retryLoad();
        }
    });

    setInterval(() => {
        const errorElement = document.querySelector("#subforos-content .error");
        if (errorElement) {
            console.log("Reintentando conexión automáticamente...");
            retryLoad();
        }
    }, 30000);

    toggleModerationSection();
});

document.addEventListener("userLoggedIn", (event) => {
    console.log("app.js: Usuario ha iniciado sesión:", event.detail);
    toggleModerationSection();
});

document.addEventListener("userLoggedOut", () => {
    console.log("app.js: Usuario ha cerrado sesión.");
    toggleModerationSection();
});
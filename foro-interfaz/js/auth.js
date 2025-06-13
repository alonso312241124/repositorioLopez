// --- Elementos del DOM ---
let loginDialog = null;
let registerDialog = null;
let openLoginDialogBtn = null;
let openRegisterDialogBtn = null;
let profileLink = null;
let logoutBtn = null;
let welcomeMessageSpan = null;
let loginForm = null;
let loginUsernameInput = null;
let loginPasswordInput = null;
let loginMessageDiv = null;
let registerForm = null;
let registerUsernameInput = null;
let registerEmailInput = null;
let registerPasswordInput = null;
let registerMessageDiv = null;
let switchToRegisterLink = null;
let switchToLoginLink = null;
let userProfileInfo = null;

// Función para inicializar referencias a elementos del DOM
function initializeDOMElements() {
    loginDialog = document.getElementById("login-dialog");
    registerDialog = document.getElementById("register-dialog");
    openLoginDialogBtn = document.getElementById("open-login-dialog-btn");
    openRegisterDialogBtn = document.getElementById("open-register-dialog-btn");
    profileLink = document.getElementById("profile-link");
    logoutBtn = document.getElementById("logout-btn");
    welcomeMessageSpan = document.getElementById("welcome-message");
    loginForm = document.getElementById("login-form");
    loginUsernameInput = document.getElementById("login-username");
    loginPasswordInput = document.getElementById("login-password");
    loginMessageDiv = document.getElementById("login-message");
    registerForm = document.getElementById("register-form");
    registerUsernameInput = document.getElementById("register-username");
    registerEmailInput = document.getElementById("register-email");
    registerPasswordInput = document.getElementById("register-password");
    registerMessageDiv = document.getElementById("register-message");
    switchToRegisterLink = document.getElementById("switch-to-register");
    switchToLoginLink = document.getElementById("switch-to-login");
    userProfileInfo = document.getElementById("user-profile-info");
}

// --- Funciones de Utilidad ---
function displayDialogMessage(element, message, type = "error") {
    if (element) {
        element.innerHTML = message;
        element.className = `dialog-message ${type}`;
    }
}

function clearDialogMessage(element) {
    if (element) {
        element.innerHTML = "";
        element.className = "dialog-message";
    }
}

function openDialog(dialog) {
    if (dialog && typeof dialog.showModal === "function") {
        dialog.showModal();
        clearDialogMessage(loginMessageDiv);
        clearDialogMessage(registerMessageDiv);
    } else {
        console.log("Intento de abrir un diálogo inválido o no soportado.");
    }
}

function closeDialog(dialog) {
    if (dialog && typeof dialog.close === "function") {
        dialog.close();
        clearDialogMessage(loginMessageDiv);
        clearDialogMessage(registerMessageDiv);
    }
}

function closeAllAuthDialogs() {
    if (loginDialog && loginDialog.open) {
        loginDialog.close();
    }
    if (registerDialog && registerDialog.open) {
        registerDialog.close();
    }
    clearDialogMessage(loginMessageDiv);
    clearDialogMessage(registerMessageDiv);
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    clearDialogMessage(registerMessageDiv);

    if (!registerForm) return;

    const username = registerUsernameInput.value.trim();
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value;

    if (!username || !email || !password) {
        displayDialogMessage(
            registerMessageDiv,
            "Todos los campos son obligatorios.",
            "error",
        );
        return;
    }
    if (password.length < 6) {
        displayDialogMessage(
            registerMessageDiv,
            "La contraseña debe tener al menos 6 caracteres.",
            "error",
        );
        return;
    }

    const submitButton = registerForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton
        ? submitButton.textContent
        : "Registrarse";
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Registrando...";
    }

    try {
        const response = await fetch(`${API_BASE_URL_AUTH}/api/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            const errorMsg =
                result.message ||
                (result.errors && result.errors.join(", ")) ||
                response.statusText;
            throw new Error(
                `Error ${response.status}: ${errorMsg || "No se pudo registrar"}`,
            );
        }

        console.log("Registro exitoso:", result);
        displayDialogMessage(
            registerMessageDiv,
            `¡Registro exitoso, ${result.username}! Ahora puedes iniciar sesión.`,
            "success",
        );
        if (registerForm) registerForm.reset();
        setTimeout(() => {
            closeDialog(registerDialog);
            openDialog(loginDialog);
        }, 2000);
    } catch (error) {
        console.error("Error en el registro:", error);
        displayDialogMessage(
            registerMessageDiv,
            error.message || "Ocurrió un error durante el registro.",
            "error",
        );
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    clearDialogMessage(loginMessageDiv);

    if (!loginForm)
        return;

    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;

    if (!username || !password) {
        displayDialogMessage(
            loginMessageDiv,
            "Nombre de usuario y contraseña son obligatorios.",
            "error",
        );
        return;
    }

    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton
        ? submitButton.textContent
        : "Iniciar Sesión";
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Iniciando...";
    }

    try {
        const response = await fetch(`${API_BASE_URL_AUTH}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            const errorMsg =
                result.message ||
                (result.error && typeof result.error === "string"
                    ? result.error
                    : response.statusText);
            throw new Error(
                `Error ${response.status}: ${errorMsg || "Credenciales incorrectas"}`,
            );
        }

        console.log("Login exitoso:", result);

        localStorage.setItem("authToken", result.token);
        const userDataToStore = {
            userId: result.userId,
            username: result.username,
            roles: result.roles || [],
            foto: result.foto,
            fechaRegistro: result.fechaRegistro,
            reputacion: result.reputacion,
        };
        localStorage.setItem("userData", JSON.stringify(userDataToStore));

        closeDialog(loginDialog);
        if (loginForm) loginForm.reset();

        updateAuthUI(userDataToStore);
        document.dispatchEvent(
            new CustomEvent("userLoggedIn", { detail: userDataToStore }),
        );
    } catch (error) {
        console.error("Error en el login:", error);
        displayDialogMessage(
            loginMessageDiv,
            error.message || "Error al iniciar sesión. Verifica tus credenciales.",
            "error",
        );
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
}

function updateAuthUI(userData) {
    if (openLoginDialogBtn && openRegisterDialogBtn) {
        if (userData) {
            openLoginDialogBtn.style.display = "none";
            openRegisterDialogBtn.style.display = "none";

            if (profileLink) {
                profileLink.href = `perfil.html?username=${encodeURIComponent(
                    userData.username,
                )}`;
                profileLink.style.display = "inline-block";
            }
            if (logoutBtn) logoutBtn.style.display = "inline-block";

            if (welcomeMessageSpan) {
                welcomeMessageSpan.textContent = `Bienvenido, ${userData.username}`;
                welcomeMessageSpan.style.display = "inline";
            }
        } else {
            openLoginDialogBtn.style.display = "inline-block";
            openRegisterDialogBtn.style.display = "inline-block";

            if (profileLink) profileLink.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "none";
            if (welcomeMessageSpan) welcomeMessageSpan.style.display = "none";
        }
    }

    if (userProfileInfo) {
        if (userData) {
            const isAdmin =
                userData.roles && userData.roles.includes("ROLE_ADMIN");
            const adminTag = isAdmin
                ? '<span class="admin-tag">[ADMIN]</span>'
                : "";

            let userPhoto;
            if (userData.foto && userData.foto.startsWith("uploads/")) {
                userPhoto = `${API_BASE_URL_AUTH}/${userData.foto}`;
            } else if (userData.foto && userData.foto.trim() !== "") {
                userPhoto = userData.foto;
            } else {
                userPhoto = "img/placeholder_avatar.png";
            }

            console.log("Foto construida:", userPhoto);

            const fechaRegistroFormatted = userData.fechaRegistro
                ? new Date(userData.fechaRegistro).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                })
                : "N/A";

            userProfileInfo.innerHTML = `
                <div class="profile-details-wrapper">
                    <img src="${userPhoto}" alt="Foto de ${userData.username}" class="profile-avatar-square" onerror="this.src='img/placeholder_avatar.png';"/>
                    <div class="profile-text-content">
                        <a href="perfil.html?username=${encodeURIComponent(userData.username)}" class="profile-username profile-link">
                            ${userData.username} ${adminTag}
                        </a>
                        <p class="profile-meta-info">Registrado: ${fechaRegistroFormatted}</p>
                        <p class="profile-meta-info">Reputación: ${userData.reputacion !== undefined ? userData.reputacion : "N/A"}</p>
                    </div>
                </div>
            `;
            userProfileInfo.classList.remove("placeholder-content");
        } else {
            userProfileInfo.innerHTML = `No has iniciado sesión`;
            userProfileInfo.classList.add("placeholder-content");
        }
    }
}

function handleLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    updateAuthUI(null);
    console.log("Usuario deslogueado.");
    document.dispatchEvent(new CustomEvent("userLoggedOut"));
}

async function fetchCurrentUserProfile() {
    const token = localStorage.getItem("authToken");
    const userDataString = localStorage.getItem("userData");

    if (!token || !userDataString) {
        return null;
    }

    let currentUser;
    try {
        currentUser = JSON.parse(userDataString);
        if (!currentUser || !currentUser.username) {
            throw new Error("Datos de usuario en localStorage inválidos.");
        }
    } catch (e) {
        console.error("Error parseando userData, deslogueando.", e);
        handleLogout();
        return null;
    }

    try {
        // Usamos el endpoint existente, pasando el username de localStorage en la URL.
        const response = await fetch(
            `${API_BASE_URL_AUTH}/api/perfil/${currentUser.username}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // Necesario para pasar la seguridad
                },
            },
        );

        if (!response.ok) {
            console.error("Token inválido o sesión expirada. Deslogueando.");
            handleLogout();
            return null;
        }

        const freshUserData = await response.json();

        // Mapeamos los campos del DTO a la estructura que usamos en el frontend
        const userDataToStore = {
            userId: freshUserData.id,
            username: freshUserData.username,
            roles: freshUserData.authorities || [],
            foto: freshUserData.foto,
            fechaRegistro: freshUserData.fechaRegistro,
            reputacion: freshUserData.reputacion,
        };

        // Actualizamos localStorage con los datos más recientes.
        localStorage.setItem("userData", JSON.stringify(userDataToStore));
        return userDataToStore;
    } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
        return null;
    }
}

async function checkInitialLoginStatus() {
    const token = localStorage.getItem("authToken");
    let userData = null;

    if (token) {
        console.log("Token encontrado, obteniendo perfil de usuario...");
        // Obtenemos los datos desde el servidor
        userData = await fetchCurrentUserProfile();
    }

    // updateAuthUI se encarga de mostrar el estado correcto,
    // ya sea con los datos del usuario o el estado de "no logueado".
    updateAuthUI(userData);
    return userData;
}

function addHeaderAuthButtonListeners() {
    if (openLoginDialogBtn) {
        openLoginDialogBtn.addEventListener("click", handleOpenLoginDialog);
    }
    if (openRegisterDialogBtn) {
        openRegisterDialogBtn.addEventListener("click", handleOpenRegisterDialog);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }
}

function handleOpenLoginDialog() {
    if (loginDialog) openDialog(loginDialog);
    if (registerDialog) closeDialog(registerDialog);
}

function handleOpenRegisterDialog() {
    if (registerDialog) openDialog(registerDialog);
    if (loginDialog) closeDialog(loginDialog);
}

document.addEventListener("DOMContentLoaded", async () => {
    initializeDOMElements();
    await checkInitialLoginStatus(); // Usamos await para esperar la verificación
    addHeaderAuthButtonListeners();

    document.querySelectorAll(".close-dialog-btn").forEach((btn) => {
        btn.addEventListener("click", closeAllAuthDialogs);
    });

    if (loginDialog) {
        loginDialog.addEventListener("click", (event) => {
            if (event.target === loginDialog) {
                closeDialog(loginDialog);
            }
        });
    }
    if (registerDialog) {
        registerDialog.addEventListener("click", (event) => {
            if (event.target === registerDialog) {
                closeDialog(registerDialog);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", handleLoginSubmit);
    }
    if (registerForm) {
        registerForm.addEventListener("submit", handleRegisterSubmit);
    }

    if (switchToRegisterLink) {
        switchToRegisterLink.addEventListener("click", (e) => {
            e.preventDefault();
            closeDialog(loginDialog);
            openDialog(registerDialog);
        });
    }
    if (switchToLoginLink) {
        switchToLoginLink.addEventListener("click", (e) => {
            e.preventDefault();
            closeDialog(registerDialog);
            openDialog(loginDialog);
        });
    }

    console.log("auth.js cargado y listo.");
});
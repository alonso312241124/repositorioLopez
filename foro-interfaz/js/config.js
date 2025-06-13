// js/config.js
const getApiBaseUrl = () => {
    // Si estamos en un entorno Docker con Nginx proxy-ing (accediendo al puerto 3000),
    // o si el hostname no es 'localhost' (por ejemplo, en un servidor),
    // usamos URLs relativas para que Nginx haga el proxy.
    // En cualquier otro caso (típicamente desarrollo local directo), usamos localhost.
    if (window.location.port === '3000' || window.location.hostname !== 'localhost') {
        return ''; // Usar URLs relativas (ej. /api/subforos), Nginx hará el proxy
    } else {
        // Desarrollo local
        return 'http://localhost:8080';
    }
};

// Exportar la configuración
const API_CONFIG = {
    BASE_URL: getApiBaseUrl(),
    AUTH_URL: getApiBaseUrl()
};

// Para compatibilidad con tus archivos existentes
const API_BASE_URL = API_CONFIG.BASE_URL;
const API_BASE_URL_AUTH = API_CONFIG.AUTH_URL;

console.log("API_BASE_URL configurado como:", API_BASE_URL);
const Top3Module = {

    async cargarTop3() {
        const container = document.querySelector('.leaderboard-animated .placeholder-content');
        if (!container)
            return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/reputacion/top3`); 
            if (!response.ok) throw new Error('Error al cargar');

            const top3 = await response.json();
            this.mostrarTop3(top3, container);
        } catch (error) {
            console.error("Error al cargar el Top 3:", error); 
            container.innerHTML = `
                <div style="text-align: center; padding: 15px; color: #94a3b8;">
                    Error al cargar la lista
                    <br><button onclick="Top3Module.cargarTop3()" style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; margin-top: 8px; cursor: pointer;">Reintentar</button>
                </div>
            `;
        }
    },

    mostrarTop3(top3, container) {
        let html = '<div class="top3-container">';

        top3.forEach((usuario, index) => {
            const posicion = index + 1;

            let foto;
            if (usuario.foto && usuario.foto.startsWith('uploads/')) {
                foto = `/${usuario.foto}`; // Ejemplo: /uploads/image.jpg
            } else if (usuario.foto) {
                foto = usuario.foto;
            } else {
                foto = 'img/placeholder_avatar.png';
            }
            console.log("x (ruta de foto final):", foto); 

            const medalla = posicion === 1 ? '🥇' : posicion === 2 ? '🥈' : '🥉';
            const username = usuario.username;

            html += `
            <div class="top3-item pos-${posicion}" onclick="Top3Module.irAPerfil('${usuario.username}')">
                <div class="top3-medal">${medalla}</div>
                <div class="top3-avatar">
                    <img src="${foto}" alt="${usuario.username}" onerror="this.src='img/placeholder_avatar.png';">
                </div>
                <div class="top3-name">${username}</div>
                <div class="top3-points">⭐ ${usuario.reputacion}</div>
            </div>
        `;
        });

        html += '</div>';
        container.innerHTML = html;
    },

    irAPerfil(username) {
        const usernamePerfil = encodeURIComponent(username);
        window.location.href = `perfil.html?username=${usernamePerfil}`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Top3Module.cargarTop3();
});

document.addEventListener('userLoggedIn', () => {
    Top3Module.cargarTop3();
});

document.addEventListener('userLoggedOut', () => {
    Top3Module.cargarTop3();
});
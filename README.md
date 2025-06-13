# Repositorio Alonso

Este repositorio contiene una aplicación web completa con un backend Spring Boot, un frontend y una base de datos MySQL, todo orquestado con Docker Compose.

---

## Despliegue con Docker Compose

Sigue estos pasos para levantar la aplicación:

### Requisitos Previos

Asegúrate de tener **Docker** y **Docker Compose** instalados en tu equipo.

*   **Descarga Docker Desktop:** [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
*   Asegúrate de que Docker esté en ejecución.

### Pasos de Despliegue

1.  **Clonar el Repositorio:**

    ```bash
    git clone https://github.com/alonso312241124/repositorioLopez
    ```

2.  **Navegar al Directorio:**

    ```bash
    cd repositorioLopez
    ```

3.  **Iniciar la Aplicación:**

    ```bash
    docker-compose up -d
    ```

4.  **Acceder a la Aplicación:**
    Una vez que los servicios estén en marcha, accede al frontend en tu navegador:

    [http://localhost:3000](http://localhost:3000)


5. **Credenciales de Administrador**  
   Para acceder a la vista de moderación, inicia sesión con las siguientes credenciales de administrador:

   - **Usuario:** Alonso  
   - **Contraseña:** test123
  
     
### Detener y Limpiar

Para detener todos los servicios y eliminar sus contenedores y contenido de la base de datos:

```bash
docker-compose down
```

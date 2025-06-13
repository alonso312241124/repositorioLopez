# Dockerfile (en la raíz del proyecto backend)
FROM openjdk:21-jdk-slim

WORKDIR /app

# Copiar archivos de Maven
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Descargar dependencias
RUN ./mvnw dependency:go-offline -B

# Copiar código fuente
COPY src src

# Construir la aplicación
RUN ./mvnw clean package -DskipTests

# Crear directorio para uploads
RUN mkdir -p uploads

# Exponer puerto
EXPOSE 8080

# Ejecutar la aplicación
CMD ["java", "-jar", "target/foro-0.0.1-SNAPSHOT.jar"]

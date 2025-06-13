-- phpMyAdmin SQL Dump
-- version 5.1.1deb5ubuntu1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 09, 2025 at 06:51 PM
-- Server version: 8.0.34-0ubuntu0.22.04.1
-- PHP Version: 8.1.2-1ubuntu2.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `baseLopez`
--
CREATE DATABASE IF NOT EXISTS `baseLopez` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `baseLopez`;

-- --------------------------------------------------------

--
-- Table structure for table `comentario`
--

CREATE TABLE `comentario` (
  `id` bigint NOT NULL,
  `contenido` text NOT NULL,
  `fecha_creacion` datetime(6) NOT NULL,
  `post_id` bigint NOT NULL,
  `usuario_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `favorito`
--

CREATE TABLE `favorito` (
  `id` bigint NOT NULL,
  `post_id` bigint NOT NULL,
  `usuario_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `foto_comentario`
--

CREATE TABLE `foto_comentario` (
  `id` bigint NOT NULL,
  `foto` varchar(255) NOT NULL,
  `comentario_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `foto_post`
--

CREATE TABLE `foto_post` (
  `id` bigint NOT NULL,
  `foto` varchar(255) NOT NULL,
  `post_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post`
--

CREATE TABLE `post` (
  `id` bigint NOT NULL,
  `contenido` text NOT NULL,
  `fecha_creacion` datetime(6) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `subforo_id` bigint NOT NULL,
  `usuario_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reporte`
--

CREATE TABLE `reporte` (
  `id` bigint NOT NULL,
  `fecha_reporte` datetime(6) NOT NULL,
  `motivo` text NOT NULL,
  `comentario_id` bigint DEFAULT NULL,
  `post_id` bigint DEFAULT NULL,
  `reportado_id` bigint NOT NULL,
  `reportador_id` bigint NOT NULL,
  `resuelto` bit(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reputacion`
--

CREATE TABLE `reputacion` (
  `id` bigint NOT NULL,
  `fecha` datetime(6) NOT NULL,
  `valor` int NOT NULL,
  `emisor_id` bigint NOT NULL,
  `receptor_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subforo`
--

CREATE TABLE `subforo` (
  `id` bigint NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `usuario`
--

CREATE TABLE `usuario` (
  `id` bigint NOT NULL,
  `email` varchar(255) NOT NULL,
  `fecha_registro` datetime(6) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `reputacion` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `usuario_authorities`
--

CREATE TABLE `usuario_authorities` (
  `usuario_id` bigint NOT NULL,
  `authorities` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `comentario`
--
ALTER TABLE `comentario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK5tm5pw9ofhc1dxw2xulc348jg` (`post_id`),
  ADD KEY `FKixspmid2pb85o8ypsd20jakxg` (`usuario_id`);

--
-- Indexes for table `favorito`
--
ALTER TABLE `favorito`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKt0rxa0o3cq2lpmo8xiacqbdfs` (`usuario_id`,`post_id`),
  ADD KEY `FKicygrw1nhgd940w0mho8knoyu` (`post_id`);

--
-- Indexes for table `foto_comentario`
--
ALTER TABLE `foto_comentario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKrew27ayeji8o3syrb3inj0mk8` (`comentario_id`);

--
-- Indexes for table `foto_post`
--
ALTER TABLE `foto_post`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKhw468wtaq2f2o2q8luu0qd9va` (`post_id`);

--
-- Indexes for table `post`
--
ALTER TABLE `post`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKtqwsnkr29pod9hh4l1shxlp21` (`subforo_id`),
  ADD KEY `FK27q2ean2bp3015mcu7a5ukacn` (`usuario_id`);

--
-- Indexes for table `reporte`
--
ALTER TABLE `reporte`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKcpc04fevox619amhngsd0j1wx` (`comentario_id`),
  ADD KEY `FKlasqqly87p39m60ourufwoacs` (`post_id`),
  ADD KEY `FKr5vq1gc30ysmspkcj2073699r` (`reportado_id`),
  ADD KEY `FKaj49jfkxsh0xjtiq4wov6jvkg` (`reportador_id`);

--
-- Indexes for table `reputacion`
--
ALTER TABLE `reputacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKedcxf8fg023q8oap9sxr0mywt` (`emisor_id`),
  ADD KEY `FK4hl7dd40p8r29d4j48mmiwgq` (`receptor_id`);

--
-- Indexes for table `subforo`
--
ALTER TABLE `subforo`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK5171l57faosmj8myawaucatdw` (`email`),
  ADD UNIQUE KEY `UK863n1y3x0jalatoir4325ehal` (`username`);

--
-- Indexes for table `usuario_authorities`
--
ALTER TABLE `usuario_authorities`
  ADD KEY `FKdp9xo5g6n8v3s27uy4atw96th` (`usuario_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `comentario`
--
ALTER TABLE `comentario`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `favorito`
--
ALTER TABLE `favorito`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `foto_comentario`
--
ALTER TABLE `foto_comentario`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `foto_post`
--
ALTER TABLE `foto_post`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `post`
--
ALTER TABLE `post`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reporte`
--
ALTER TABLE `reporte`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reputacion`
--
ALTER TABLE `reputacion`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subforo`
--
ALTER TABLE `subforo`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `comentario`
--
ALTER TABLE `comentario`
  ADD CONSTRAINT `FK5tm5pw9ofhc1dxw2xulc348jg` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`),
  ADD CONSTRAINT `FKixspmid2pb85o8ypsd20jakxg` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);

--
-- Constraints for table `favorito`
--
ALTER TABLE `favorito`
  ADD CONSTRAINT `FKicygrw1nhgd940w0mho8knoyu` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`),
  ADD CONSTRAINT `FKtexs274tw5tyvj5uowwooa1fw` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);

--
-- Constraints for table `foto_comentario`
--
ALTER TABLE `foto_comentario`
  ADD CONSTRAINT `FKrew27ayeji8o3syrb3inj0mk8` FOREIGN KEY (`comentario_id`) REFERENCES `comentario` (`id`);

--
-- Constraints for table `foto_post`
--
ALTER TABLE `foto_post`
  ADD CONSTRAINT `FKhw468wtaq2f2o2q8luu0qd9va` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`);

--
-- Constraints for table `post`
--
ALTER TABLE `post`
  ADD CONSTRAINT `FK27q2ean2bp3015mcu7a5ukacn` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FKtqwsnkr29pod9hh4l1shxlp21` FOREIGN KEY (`subforo_id`) REFERENCES `subforo` (`id`);

--
-- Constraints for table `reporte`
--
ALTER TABLE `reporte`
  ADD CONSTRAINT `FKaj49jfkxsh0xjtiq4wov6jvkg` FOREIGN KEY (`reportador_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FKcpc04fevox619amhngsd0j1wx` FOREIGN KEY (`comentario_id`) REFERENCES `comentario` (`id`),
  ADD CONSTRAINT `FKlasqqly87p39m60ourufwoacs` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`),
  ADD CONSTRAINT `FKr5vq1gc30ysmspkcj2073699r` FOREIGN KEY (`reportado_id`) REFERENCES `usuario` (`id`);

--
-- Constraints for table `reputacion`
--
ALTER TABLE `reputacion`
  ADD CONSTRAINT `FK4hl7dd40p8r29d4j48mmiwgq` FOREIGN KEY (`receptor_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FKedcxf8fg023q8oap9sxr0mywt` FOREIGN KEY (`emisor_id`) REFERENCES `usuario` (`id`);

--
-- Constraints for table `usuario_authorities`
--
ALTER TABLE `usuario_authorities`
  ADD CONSTRAINT `FKdp9xo5g6n8v3s27uy4atw96th` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

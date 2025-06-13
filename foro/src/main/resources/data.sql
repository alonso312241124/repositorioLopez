INSERT IGNORE INTO `subforo` (`id`, `nombre`, `imagen`, `descripcion`) VALUES
(1, 'Formación', 'education.png', 'Para principiantes: Conceptos, Recursos, guías, dudas básicas y avanzadas.'),
(2, 'Noticias', 'news.png', 'Comparte y comenta noticias relevantes sobre economía, mercados financieros y eventos globales.'),
(3, 'Bolsa', 'stocks.png', 'Empresas cotizadas, análisis, acciones, estratégias, ETFs e índices.'),
(4, 'Criptomonedas', 'bitcoin.png', 'Bitcoin, altcoins, DeFi, tecnología blockchain y exchanges.'),
(5, 'Renta Fija', 'bond.png', 'Letras del Tesoro, depósitos y otras opciones de inversión con menor riesgo.'),
(6, 'Inversión Inmobiliaria', 'realestate.png', 'Compra, alquileres y rentabilidad del mercado inmobiliario.');

-- Insertar el usuario 'Alonso' si no existe (usando INSERT IGNORE)
-- La contraseña encriptada es $2a$12$kOc4G9mLu3j6V3gaZgmCveQ2zfaginu1x7u7qpiQXdJRtB0J..Zve
INSERT IGNORE INTO `usuario` (`id`, `email`, `fecha_registro`, `foto`, `password`, `username`, `reputacion`) VALUES
(1, 'alonso@admin.com', NOW(), NULL, '$2a$12$kOc4G9mLu3j6V3gaZgmCveQ2zfaginu1x7u7qpiQXdJRtB0J..Zve', 'Alonso', 0);

-- Asignar el rol 'ROLE_ADMIN' al usuario 'Alonso' si no lo tiene (usando INSERT IGNORE)
INSERT IGNORE INTO `usuario_authorities` (`usuario_id`, `authorities`) VALUES
(1, 'ROLE_ADMIN');

COMMIT;

# Documento de Requisitos: DVD Library Full App

## Introducción

Extensión completa de la aplicación de gestión de colección de DVDs existente (Next.js 16, Supabase, Tailwind CSS, shadcn/ui). El sistema actual ya cuenta con autenticación básica, catálogo de DVDs con campo `numero` y CRUD completo. Esta extensión agrega autenticación completa con páginas dedicadas, un dashboard estilo Netflix con modo oscuro, integración con TMDB para autocompletar datos, gestión enriquecida de películas (posters, estado visto/pendiente, comentarios), vista detalle, estadísticas de colección, sistema de favoritos y lista de deseos, exportación CSV y una landing page de marketing.

## Glosario

- **Sistema**: La aplicación web Next.js completa.
- **Usuario**: Persona autenticada con cuenta en Supabase Auth.
- **DVD**: Registro de película en la colección del usuario (tabla `dvds`).
- **TMDB**: The Movie Database API, servicio externo de metadatos de películas.
- **Dashboard**: Vista principal tipo Netflix con grid de posters tras autenticarse.
- **Estado_Visionado**: Campo que indica si una película fue vista (`vista`) o está pendiente (`pendiente`).
- **Favorito**: Marca que el usuario asigna a un DVD de su colección.
- **Lista_Deseos**: Colección separada de películas que el usuario quiere adquirir.
- **Estadísticas**: Resumen calculado de la colección del usuario.
- **Landing_Page**: Página pública de marketing sin autenticación requerida.
- **Poster**: Imagen de portada de la película, obtenida de TMDB o URL manual.
- **Exportación_CSV**: Archivo de texto con separación por comas que contiene todos los DVDs del usuario.

---

## Requisitos

### Requisito 1: Autenticación completa

**Historia de usuario:** Como visitante, quiero registrarme, iniciar sesión y recuperar mi contraseña, para poder acceder a mi colección de DVDs de forma segura.

#### Criterios de aceptación

1. WHEN un visitante accede a `/auth/registro`, THE Sistema SHALL mostrar un formulario con campos de email, contraseña y confirmación de contraseña.
2. WHEN un visitante envía el formulario de registro con datos válidos, THE Sistema SHALL crear una cuenta en Supabase Auth y redirigir al dashboard.
3. IF el email ya está registrado, THEN THE Sistema SHALL mostrar un mensaje de error indicando que el email ya existe.
4. IF las contraseñas no coinciden en el registro, THEN THE Sistema SHALL mostrar un error de validación antes de enviar el formulario.
5. WHEN un usuario accede a `/auth/login`, THE Sistema SHALL mostrar un formulario con campos de email y contraseña.
6. WHEN un usuario envía credenciales válidas en el login, THE Sistema SHALL iniciar sesión y redirigir al dashboard.
7. IF las credenciales son incorrectas, THEN THE Sistema SHALL mostrar un mensaje de error genérico sin revelar si el email existe.
8. WHEN un usuario accede a `/auth/recuperar`, THE Sistema SHALL mostrar un formulario para ingresar su email.
9. WHEN un usuario envía su email en el formulario de recuperación, THE Sistema SHALL enviar un email de recuperación vía Supabase Auth y mostrar confirmación.
10. WHILE el usuario tiene sesión activa, THE Sistema SHALL mantener la sesión persistente entre recargas de página mediante cookies gestionadas por el middleware existente.
11. WHEN un usuario autenticado hace clic en "Cerrar sesión", THE Sistema SHALL destruir la sesión y redirigir a `/auth/login`.
12. IF un visitante no autenticado intenta acceder a rutas protegidas (`/dashboard`, `/biblioteca`, `/dvd`), THEN THE Sistema SHALL redirigir a `/auth/login`.

---

### Requisito 2: Dashboard estilo Netflix

**Historia de usuario:** Como usuario autenticado, quiero ver mi colección en un dashboard visual con posters y modo oscuro, para disfrutar de una experiencia de navegación moderna.

#### Criterios de aceptación

1. WHEN un usuario autenticado accede a `/dashboard`, THE Sistema SHALL mostrar un grid de tarjetas con el poster de cada película.
2. THE Sistema SHALL aplicar un tema oscuro por defecto con paleta de colores negro, violeta, azul y blanco.
3. WHEN el poster de una película no está disponible, THE Sistema SHALL mostrar una imagen de placeholder con el título de la película.
4. WHEN el usuario hace clic en una tarjeta del dashboard, THE Sistema SHALL navegar a la vista detalle de esa película.
5. THE Dashboard SHALL mostrar el título, año y estado de visionado sobre cada tarjeta de poster.
6. WHEN la colección tiene más de 20 películas, THE Dashboard SHALL implementar scroll infinito o paginación para no cargar todos los registros a la vez.
7. THE Dashboard SHALL incluir una barra de navegación con el nombre del usuario, acceso a estadísticas y botón de cerrar sesión.
8. WHEN el usuario aplica un filtro por estado (vista/pendiente/todas), THE Dashboard SHALL actualizar el grid mostrando solo las películas que coincidan.

---

### Requisito 3: Gestión enriquecida de películas

**Historia de usuario:** Como usuario, quiero agregar posters, marcar películas como vistas y escribir comentarios personales, para llevar un registro completo de mi experiencia con cada película.

#### Criterios de aceptación

1. THE Sistema SHALL extender el modelo de datos `dvds` con los campos: `estado_visionado` (enum: `vista` | `pendiente`), `fecha_vista` (timestamp nullable), `comentario` (text nullable), `es_favorito` (boolean, default false).
2. WHEN un usuario crea o edita un DVD, THE DvdForm SHALL incluir campos para `estado_visionado` y `comentario`.
3. WHEN un usuario hace clic en "Marcar como vista" en cualquier tarjeta o vista detalle, THE Sistema SHALL actualizar `estado_visionado` a `vista` y registrar `fecha_vista` con la fecha y hora actual.
4. WHEN una película ya está marcada como vista, THE Sistema SHALL mostrar un indicador visual (ícono o badge) sobre su tarjeta en el dashboard.
5. WHEN un usuario escribe un comentario y guarda, THE Sistema SHALL persistir el comentario en el campo `comentario` del registro.
6. WHEN un usuario hace clic en el ícono de favorito de una tarjeta, THE Sistema SHALL alternar el valor de `es_favorito` del DVD.
7. WHEN `es_favorito` es `true`, THE Sistema SHALL mostrar un ícono de estrella o corazón destacado sobre la tarjeta.

---

### Requisito 4: Integración con TMDB

**Historia de usuario:** Como usuario, quiero que al escribir el título de una película se autocompleten los datos desde TMDB, para ahorrar tiempo al agregar nuevas películas.

#### Criterios de aceptación

1. WHEN el usuario escribe 3 o más caracteres en el campo `titulo` del formulario, THE Sistema SHALL realizar una búsqueda en la API de TMDB con debounce de 400ms.
2. WHEN TMDB devuelve resultados, THE Sistema SHALL mostrar una lista desplegable con hasta 5 sugerencias (título, año, poster thumbnail).
3. WHEN el usuario selecciona una sugerencia de TMDB, THE Sistema SHALL autocompletar los campos: `titulo`, `titulo_original`, `año`, `director`, `genero`, `duracion`, `sinopsis`, `poster_url` y `tmdb_id`.
4. IF la API de TMDB no responde en 5 segundos, THEN THE Sistema SHALL mostrar un mensaje de error no bloqueante y permitir continuar con entrada manual.
5. IF la búsqueda en TMDB no devuelve resultados, THEN THE Sistema SHALL mostrar el mensaje "No se encontraron resultados en TMDB" en el desplegable.
6. THE Sistema SHALL usar la variable de entorno `TMDB_API_KEY` existente para autenticar las peticiones a TMDB.
7. WHEN el usuario selecciona una película de TMDB, THE Sistema SHALL obtener los detalles completos (incluyendo director y duración) mediante un segundo llamado al endpoint de detalles de TMDB.

---

### Requisito 5: Vista detalle de película

**Historia de usuario:** Como usuario, quiero ver toda la información de una película en una página dedicada, para revisar detalles, agregar notas y marcarla como vista.

#### Criterios de aceptación

1. WHEN el usuario navega a `/dvd/[id]`, THE Sistema SHALL mostrar la página de detalle de esa película.
2. THE Vista_Detalle SHALL mostrar: poster en tamaño grande, título, título original, año, director, género, duración, sinopsis, formato, ubicación, calificación, estado de visionado, fecha vista y comentario.
3. THE Vista_Detalle SHALL incluir un botón "Marcar como vista" que ejecute la acción del Requisito 3.3.
4. THE Vista_Detalle SHALL incluir un área de texto editable para el comentario personal que se guarde automáticamente al perder el foco (autosave).
5. WHEN el usuario hace clic en "Editar", THE Vista_Detalle SHALL abrir el formulario de edición del DVD.
6. IF el `id` de la URL no corresponde a un DVD del usuario autenticado, THEN THE Sistema SHALL retornar un error 404 y mostrar una página de error.
7. THE Vista_Detalle SHALL mostrar un botón para volver al dashboard.

---

### Requisito 6: Estadísticas de colección

**Historia de usuario:** Como usuario, quiero ver estadísticas de mi colección, para conocer cuántas películas tengo, cuántas he visto y cuáles son mis géneros favoritos.

#### Criterios de aceptación

1. WHEN el usuario accede a `/estadisticas`, THE Sistema SHALL mostrar un panel con las siguientes métricas calculadas desde la base de datos del usuario.
2. THE Estadísticas SHALL incluir: total de películas en la colección, cantidad de películas vistas, cantidad de películas pendientes, porcentaje de películas vistas.
3. THE Estadísticas SHALL incluir un gráfico de los 5 géneros más frecuentes en la colección usando la librería `recharts` ya instalada.
4. THE Estadísticas SHALL calcular y mostrar el tiempo total acumulado de películas vistas en horas y minutos (suma de `duracion` donde `estado_visionado = 'vista'`).
5. THE Estadísticas SHALL mostrar la cantidad de favoritos marcados.
6. WHEN la colección está vacía, THE Estadísticas SHALL mostrar un mensaje invitando al usuario a agregar películas.

---

### Requisito 7: Sistema de favoritos y lista de deseos

**Historia de usuario:** Como usuario, quiero marcar películas como favoritas y mantener una lista de deseos separada, para organizar mejor mi colección.

#### Criterios de aceptación

1. THE Sistema SHALL permitir filtrar el dashboard para mostrar solo películas marcadas como favoritas (`es_favorito = true`).
2. THE Sistema SHALL crear una tabla `lista_deseos` en Supabase con campos: `id`, `user_id`, `titulo`, `titulo_original`, `año`, `poster_url`, `tmdb_id`, `notas`, `created_at`.
3. WHEN el usuario accede a `/lista-deseos`, THE Sistema SHALL mostrar las películas en su lista de deseos en un grid similar al dashboard.
4. WHEN el usuario hace clic en "Agregar a lista de deseos" desde la búsqueda TMDB, THE Sistema SHALL insertar el registro en la tabla `lista_deseos`.
5. WHEN el usuario hace clic en "Mover a colección" en un ítem de la lista de deseos, THE Sistema SHALL crear un DVD en la tabla `dvds` con los datos disponibles y eliminar el ítem de `lista_deseos`.
6. WHEN el usuario hace clic en "Eliminar" en un ítem de la lista de deseos, THE Sistema SHALL eliminar ese registro de `lista_deseos`.

---

### Requisito 8: Exportación de colección a CSV

**Historia de usuario:** Como usuario, quiero exportar mi colección completa a un archivo CSV, para tener una copia de seguridad o analizarla en una hoja de cálculo.

#### Criterios de aceptación

1. WHEN el usuario hace clic en "Exportar CSV" en el dashboard o estadísticas, THE Sistema SHALL generar un archivo CSV con todos los DVDs del usuario.
2. THE Exportación_CSV SHALL incluir las columnas: numero, titulo, titulo_original, año, director, genero, duracion, formato, estado_visionado, fecha_vista, calificacion, ubicacion, notas, comentario, es_favorito, fecha_agregado.
3. THE Sistema SHALL nombrar el archivo exportado con el formato `coleccion-dvd-YYYY-MM-DD.csv`.
4. THE Exportación_CSV SHALL usar punto y coma (`;`) como separador para compatibilidad con Excel en español.
5. IF la colección está vacía, THEN THE Sistema SHALL exportar un CSV con solo la fila de encabezados.

---

### Requisito 9: Landing page de marketing

**Historia de usuario:** Como visitante, quiero ver una página de presentación de la aplicación, para entender sus beneficios antes de registrarme.

#### Criterios de aceptación

1. WHEN un visitante accede a `/`, THE Sistema SHALL mostrar la landing page pública sin requerir autenticación.
2. THE Landing_Page SHALL incluir: título principal, subtítulo descriptivo, botón "Probar gratis" que redirige a `/auth/registro` y sección de beneficios con al menos 3 características destacadas.
3. THE Landing_Page SHALL incluir un botón "Iniciar sesión" en la barra de navegación que redirige a `/auth/login`.
4. WHEN un usuario autenticado accede a `/`, THE Sistema SHALL redirigir automáticamente a `/dashboard`.
5. THE Landing_Page SHALL ser responsive y mantener el tema oscuro con la paleta de colores definida (negro, violeta, azul, blanco).

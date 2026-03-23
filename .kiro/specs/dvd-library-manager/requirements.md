# Documento de Requisitos: DVD Library Manager

## Introducción

Sistema web de gestión de biblioteca personal de DVDs que permite a los usuarios autenticados catalogar su colección física de películas en formatos DVD, Blu-ray y 4K, integrar datos automáticamente desde la API de TMDB, y gestionar préstamos a terceros con seguimiento de devoluciones.

## Glosario

- **Sistema**: La aplicación web DVD Library Manager
- **Usuario**: Persona autenticada que gestiona su colección personal
- **DVD**: Ítem físico de la colección (puede ser DVD, Blu-ray o 4K)
- **Catálogo**: Conjunto de todos los DVDs registrados por un usuario
- **Préstamo**: Registro de un DVD cedido temporalmente a otra persona
- **Prestatario**: Persona a quien se le presta un DVD
- **TMDB**: The Movie Database, API externa de información cinematográfica
- **Dashboard**: Pantalla principal con resumen estadístico de la colección
- **RLS**: Row Level Security, política de seguridad a nivel de fila en Supabase
- **Supabase_Auth**: Servicio de autenticación de Supabase
- **Validator**: Componente de validación de formularios (react-hook-form + zod)

---

## Requisitos

### Requisito 1: Autenticación de Usuarios

**User Story:** Como usuario, quiero registrarme e iniciar sesión de forma segura, para que solo yo pueda acceder y gestionar mi colección personal de DVDs.

#### Criterios de Aceptación

1. WHEN un visitante accede a la aplicación sin sesión activa, THE Sistema SHALL redirigirlo a la página de inicio de sesión
2. WHEN un usuario envía un formulario de registro con email y contraseña válidos, THE Supabase_Auth SHALL crear una cuenta nueva y redirigir al dashboard
3. WHEN un usuario envía un formulario de inicio de sesión con credenciales correctas, THE Supabase_Auth SHALL iniciar la sesión y redirigir al dashboard
4. IF un usuario envía credenciales incorrectas, THEN THE Sistema SHALL mostrar un mensaje de error descriptivo sin revelar qué campo es incorrecto
5. IF un usuario intenta registrarse con un email ya existente, THEN THE Sistema SHALL mostrar un mensaje indicando que el email ya está en uso
6. WHEN un usuario cierra sesión, THE Supabase_Auth SHALL invalidar la sesión y redirigir a la página de inicio de sesión
7. THE Validator SHALL rechazar contraseñas con menos de 8 caracteres durante el registro
8. THE Validator SHALL rechazar emails con formato inválido durante el registro y el inicio de sesión

---

### Requisito 2: Dashboard con Estadísticas

**User Story:** Como usuario, quiero ver un resumen de mi colección al entrar a la aplicación, para tener una visión rápida del estado de mi biblioteca.

#### Criterios de Aceptación

1. WHEN un usuario autenticado accede al dashboard, THE Sistema SHALL mostrar el total de DVDs en su colección
2. WHEN un usuario autenticado accede al dashboard, THE Sistema SHALL mostrar el número de DVDs actualmente prestados
3. WHEN un usuario autenticado accede al dashboard, THE Sistema SHALL mostrar el número de DVDs disponibles
4. WHEN un usuario autenticado accede al dashboard, THE Sistema SHALL mostrar los préstamos activos con fecha de devolución esperada
5. WHILE el dashboard está cargando datos, THE Sistema SHALL mostrar indicadores visuales de carga
6. THE Sistema SHALL calcular las estadísticas del dashboard exclusivamente con los DVDs pertenecientes al usuario autenticado

---

### Requisito 3: Catálogo de DVDs con Búsqueda y Filtros

**User Story:** Como usuario, quiero explorar mi colección con búsqueda y filtros, para encontrar rápidamente cualquier película.

#### Criterios de Aceptación

1. WHEN un usuario accede al catálogo, THE Sistema SHALL mostrar todos los DVDs del usuario en una cuadrícula o lista
2. WHEN un usuario escribe en el campo de búsqueda, THE Sistema SHALL filtrar los DVDs mostrando solo aquellos cuyo título, director o género contenga el texto ingresado
3. WHEN un usuario selecciona un filtro de género, THE Sistema SHALL mostrar únicamente los DVDs que coincidan con ese género
4. WHEN un usuario selecciona un filtro de formato (DVD/Blu-ray/4K), THE Sistema SHALL mostrar únicamente los DVDs con ese formato
5. WHEN un usuario selecciona un filtro de estado (disponible/prestado), THE Sistema SHALL mostrar únicamente los DVDs con ese estado
6. WHEN se aplican múltiples filtros simultáneamente, THE Sistema SHALL mostrar únicamente los DVDs que cumplan todos los filtros activos
7. IF no hay DVDs que coincidan con los filtros aplicados, THEN THE Sistema SHALL mostrar un mensaje indicando que no se encontraron resultados
8. WHEN un usuario limpia los filtros, THE Sistema SHALL restaurar la vista completa del catálogo

---

### Requisito 4: CRUD Completo de DVDs

**User Story:** Como usuario, quiero agregar, editar y eliminar DVDs de mi colección, para mantener mi catálogo actualizado.

#### Criterios de Aceptación

1. WHEN un usuario completa y envía el formulario de nuevo DVD con campos obligatorios válidos, THE Sistema SHALL crear el registro en la base de datos y mostrarlo en el catálogo
2. THE Validator SHALL rechazar el formulario de DVD si el campo título está vacío
3. THE Validator SHALL rechazar el formulario de DVD si el año es menor a 1888 o mayor al año actual más 2
4. THE Validator SHALL rechazar el formulario de DVD si la calificación no está entre 1 y 5
5. WHEN un usuario edita un DVD y guarda los cambios con datos válidos, THE Sistema SHALL actualizar el registro en la base de datos y reflejar los cambios en el catálogo
6. WHEN un usuario elimina un DVD, THE Sistema SHALL solicitar confirmación antes de proceder
7. WHEN un usuario confirma la eliminación de un DVD, THE Sistema SHALL eliminar el registro y todos sus préstamos asociados de la base de datos
8. IF un usuario intenta eliminar un DVD con un préstamo activo, THEN THE Sistema SHALL mostrar una advertencia indicando que el DVD está actualmente prestado
9. THE Sistema SHALL aplicar RLS para garantizar que un usuario solo pueda crear, leer, actualizar y eliminar sus propios DVDs

---

### Requisito 5: Integración con TMDB API

**User Story:** Como usuario, quiero buscar películas en TMDB al agregar un DVD, para autocompletar los datos sin escribirlos manualmente.

#### Criterios de Aceptación

1. WHEN un usuario escribe al menos 3 caracteres en el campo de búsqueda de TMDB, THE Sistema SHALL consultar la API de TMDB y mostrar sugerencias de películas
2. WHEN un usuario selecciona una película de los resultados de TMDB, THE Sistema SHALL autocompletar los campos: título, título original, año, director, género, duración, sinopsis y URL del póster
3. IF la API de TMDB no está disponible, THEN THE Sistema SHALL mostrar un mensaje de error y permitir al usuario ingresar los datos manualmente
4. IF la búsqueda en TMDB no devuelve resultados, THEN THE Sistema SHALL mostrar un mensaje indicando que no se encontraron películas
5. THE Sistema SHALL almacenar el identificador tmdb_id junto con los datos del DVD para evitar búsquedas duplicadas
6. WHILE se realiza una búsqueda en TMDB, THE Sistema SHALL mostrar un indicador de carga en el campo de búsqueda

---

### Requisito 6: Gestión de Préstamos

**User Story:** Como usuario, quiero registrar y gestionar los préstamos de mis DVDs, para saber a quién le presté cada película y cuándo debe devolverla.

#### Criterios de Aceptación

1. WHEN un usuario registra un préstamo con nombre del prestatario y fecha de devolución esperada válidos, THE Sistema SHALL crear el registro de préstamo y actualizar el estado del DVD a "prestado"
2. THE Validator SHALL rechazar el formulario de préstamo si el campo "prestado_a" está vacío
3. THE Validator SHALL rechazar el formulario de préstamo si la fecha de devolución esperada es anterior a la fecha actual
4. IF un usuario intenta prestar un DVD que ya está en estado "prestado", THEN THE Sistema SHALL mostrar un error indicando que el DVD no está disponible
5. WHEN un usuario marca un préstamo como devuelto, THE Sistema SHALL registrar la fecha de devolución real y actualizar el estado del DVD a "disponible"
6. THE Sistema SHALL mostrar el historial completo de préstamos de cada DVD, incluyendo préstamos pasados y el activo si existe
7. THE Sistema SHALL aplicar RLS para garantizar que un usuario solo pueda gestionar los préstamos de sus propios DVDs

---

### Requisito 7: Vista de DVDs Prestados Actualmente

**User Story:** Como usuario, quiero ver todos los DVDs que están prestados en este momento, para hacer seguimiento de mis préstamos activos.

#### Criterios de Aceptación

1. WHEN un usuario accede a la vista de préstamos activos, THE Sistema SHALL mostrar únicamente los DVDs con estado "prestado" y su información de préstamo asociada
2. WHEN se muestra un préstamo activo, THE Sistema SHALL incluir: título del DVD, nombre del prestatario, fecha del préstamo y fecha de devolución esperada
3. WHEN la fecha de devolución esperada de un préstamo ha pasado, THE Sistema SHALL resaltar visualmente ese préstamo como vencido
4. WHEN un usuario marca un préstamo activo como devuelto desde esta vista, THE Sistema SHALL actualizar el estado del préstamo y del DVD inmediatamente
5. IF no hay préstamos activos, THEN THE Sistema SHALL mostrar un mensaje indicando que no hay DVDs prestados actualmente

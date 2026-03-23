# Documento de Requisitos: Catálogo de DVDs con Número de Película

## Introducción

Esta funcionalidad extiende el catálogo de DVDs del DVD Library Manager para permitir que cada película tenga un número identificador visible y editable por el usuario. El número de película actúa como un identificador secuencial o manual que facilita la organización física de la colección (por ejemplo, para etiquetar las cajas de DVDs con un número de referencia). El catálogo debe poder ordenarse por este número y el usuario debe poder editarlo junto con el resto de los datos de la película.

## Glosario

- **Sistema**: La aplicación web DVD Library Manager
- **Usuario**: Persona autenticada que gestiona su colección personal de DVDs
- **DVD**: Ítem físico de la colección (puede ser DVD, Blu-ray o 4K)
- **Catálogo**: Conjunto de todos los DVDs registrados por un usuario
- **Número de Película**: Identificador numérico secuencial o manual asignado a cada DVD, visible para el usuario y editable
- **Número_Secuencial**: Número asignado automáticamente en orden de inserción dentro de la colección del usuario
- **Formulario_DVD**: Componente de formulario para crear o editar un DVD
- **Validator**: Componente de validación de formularios (react-hook-form + zod)
- **Catálogo_View**: Vista principal del catálogo de DVDs
- **RLS**: Row Level Security, política de seguridad a nivel de fila en Supabase

---

## Requisitos

### Requisito 1: Campo de Número de Película en la Base de Datos

**User Story:** Como usuario, quiero que cada DVD de mi colección tenga un número identificador único, para poder organizar físicamente mi colección con etiquetas numeradas.

#### Criterios de Aceptación

1. THE Sistema SHALL almacenar un campo `numero` de tipo entero positivo en la tabla `dvds` para cada registro
2. WHEN un usuario agrega un nuevo DVD a su colección, THE Sistema SHALL asignar automáticamente el siguiente número disponible dentro de la colección de ese usuario
3. THE Sistema SHALL garantizar que el campo `numero` sea único por usuario (no puede haber dos DVDs del mismo usuario con el mismo número)
4. IF el campo `numero` está vacío al guardar un DVD, THEN THE Sistema SHALL asignar automáticamente el siguiente número disponible
5. THE Sistema SHALL aplicar RLS para garantizar que la unicidad del número se evalúe únicamente dentro de la colección del usuario autenticado

---

### Requisito 2: Visualización del Número en el Catálogo

**User Story:** Como usuario, quiero ver el número de cada película en el catálogo, para identificar rápidamente cada DVD por su número de referencia.

#### Criterios de Aceptación

1. WHEN un usuario accede al Catálogo_View, THE Sistema SHALL mostrar el número de película de forma prominente en cada tarjeta o fila de DVD
2. WHEN un usuario accede al Catálogo_View, THE Sistema SHALL ordenar los DVDs por número de película de forma ascendente por defecto
3. WHEN un usuario selecciona ordenar por número de película, THE Sistema SHALL reordenar el catálogo de forma ascendente o descendente según la selección
4. THE Sistema SHALL mostrar el número de película con formato consistente (por ejemplo, con ceros a la izquierda si el catálogo supera 99 ítems)

---

### Requisito 3: Edición del Número de Película

**User Story:** Como usuario, quiero poder editar el número de una película, para reorganizar mi colección física cuando sea necesario.

#### Criterios de Aceptación

1. WHEN un usuario abre el formulario de edición de un DVD, THE Formulario_DVD SHALL mostrar el campo `numero` con el valor actual y permitir su modificación
2. WHEN un usuario guarda un DVD con un número válido, THE Sistema SHALL actualizar el campo `numero` en la base de datos
3. THE Validator SHALL rechazar el formulario si el número de película no es un entero positivo mayor a cero
4. IF un usuario intenta guardar un número de película que ya está asignado a otro DVD de su colección, THEN THE Sistema SHALL mostrar un mensaje de error indicando que ese número ya está en uso
5. WHEN un usuario edita el número de una película y guarda los cambios, THE Catálogo_View SHALL reflejar el nuevo número inmediatamente sin recargar la página

---

### Requisito 4: Creación de DVD con Número de Película

**User Story:** Como usuario, quiero poder asignar un número específico al agregar un nuevo DVD, para integrarlo en la posición correcta de mi colección física.

#### Criterios de Aceptación

1. WHEN un usuario abre el formulario de creación de un nuevo DVD, THE Formulario_DVD SHALL mostrar el campo `numero` con el siguiente número disponible como valor sugerido
2. WHERE el usuario desea asignar un número específico, THE Formulario_DVD SHALL permitir sobrescribir el número sugerido con cualquier entero positivo
3. THE Validator SHALL rechazar el formulario de creación si el número de película no es un entero positivo mayor a cero
4. IF un usuario intenta crear un DVD con un número que ya existe en su colección, THEN THE Sistema SHALL mostrar un mensaje de error indicando que ese número ya está en uso
5. WHEN un nuevo DVD es creado exitosamente, THE Catálogo_View SHALL mostrar el nuevo DVD en la posición correspondiente a su número dentro del orden del catálogo

---

### Requisito 5: Búsqueda y Filtrado por Número de Película

**User Story:** Como usuario, quiero poder buscar un DVD por su número de película, para localizarlo rápidamente cuando conozco su número de referencia.

#### Criterios de Aceptación

1. WHEN un usuario escribe un número en el campo de búsqueda del catálogo, THE Sistema SHALL incluir el campo `numero` en los criterios de búsqueda y mostrar los DVDs cuyo número coincida
2. WHEN un usuario ordena el catálogo por número de película, THE Sistema SHALL mantener el orden numérico correcto (orden numérico, no lexicográfico)
3. IF la búsqueda por número no devuelve resultados, THEN THE Sistema SHALL mostrar el mensaje estándar de "no se encontraron resultados"

---

### Requisito 6: Integridad del Número al Eliminar DVDs

**User Story:** Como usuario, quiero que al eliminar un DVD el resto de los números de mi colección no se vean afectados, para mantener la coherencia con las etiquetas físicas de mis DVDs.

#### Criterios de Aceptación

1. WHEN un usuario elimina un DVD, THE Sistema SHALL conservar los números de los demás DVDs de la colección sin reasignarlos
2. WHEN un usuario elimina un DVD, THE Sistema SHALL liberar el número del DVD eliminado para que pueda ser reutilizado en futuras adiciones
3. WHEN un usuario agrega un nuevo DVD después de haber eliminado uno, THE Sistema SHALL sugerir el siguiente número disponible (el más alto existente + 1), no el número del DVD eliminado

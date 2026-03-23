# Plan de Implementación: Catálogo de DVDs con Número de Película

## Visión General

Implementación incremental del campo `numero` en el catálogo de DVDs. Se comienza por la capa de datos (migración + tipos), luego la lógica de negocio (API), después la UI (formulario + catálogo), y finalmente la búsqueda y ordenación.

## Tareas

- [x] 1. Migración de base de datos y tipos TypeScript
  - Crear archivo de migración SQL en `supabase/migrations/` con:
    - `ALTER TABLE dvds ADD COLUMN numero INTEGER`
    - Constraint `UNIQUE(user_id, numero)`
    - Función `get_next_dvd_numero(p_user_id UUID)`
    - Script de migración de datos existentes con `ROW_NUMBER()` por `fecha_agregado`
    - `ALTER TABLE dvds ALTER COLUMN numero SET NOT NULL` (después de migrar)
  - Actualizar el tipo/interfaz `Dvd` en el código TypeScript para incluir `numero: number`
  - _Requisitos: 1.1, 1.3, 1.5_

  - [ ]* 1.1 Escribir test unitario para la función SQL `get_next_dvd_numero`
    - Verificar que retorna 1 para colección vacía
    - Verificar que retorna MAX+1 para colección con datos
    - _Requisitos: 1.2_

- [x] 2. Lógica de negocio en API Routes
  - [x] 2.1 Actualizar `GET /api/dvds` para ordenar por `numero ASC` por defecto e incluir `numero` en la respuesta
    - _Requisitos: 2.2_

  - [x] 2.2 Actualizar `POST /api/dvds` para aceptar `numero` opcional y calcular `MAX(numero)+1` si no se provee
    - Capturar error de Postgres 23505 (violación UNIQUE) y retornar 409 con mensaje descriptivo
    - _Requisitos: 1.2, 1.3, 4.1, 4.4_

  - [ ]* 2.3 Escribir test de propiedad para asignación automática de número
    - **Propiedad 2: Asignación automática es mayor que el máximo existente**
    - **Valida: Requisitos 1.2, 4.1**
    - `// Feature: dvd-catalog, Property 2: Asignación automática es mayor que el máximo existente`

  - [x] 2.4 Actualizar `PUT /api/dvds/[id]` para aceptar `numero` y validar unicidad excluyendo el propio registro
    - Capturar error 23505 y retornar 409 con mensaje descriptivo
    - _Requisitos: 3.2, 3.4_

  - [ ]* 2.5 Escribir test de propiedad para unicidad del número por usuario
    - **Propiedad 1: Unicidad del número por usuario**
    - **Valida: Requisitos 1.3, 3.4, 4.4**
    - `// Feature: dvd-catalog, Property 1: Unicidad del número por usuario`

  - [x] 2.6 Crear `GET /api/dvds/next-numero` que retorne el siguiente número disponible para el usuario autenticado
    - _Requisitos: 1.2, 4.1_

- [ ] 3. Checkpoint — Verificar que todos los tests pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

- [x] 4. Validación con Zod y hook de siguiente número
  - [x] 4.1 Actualizar el esquema Zod del formulario DVD para incluir `numero: z.number().int().positive()`
    - _Requisitos: 3.3, 4.3_

  - [ ]* 4.2 Escribir test de propiedad para validación de números no positivos
    - **Propiedad 3: Validación rechaza números no positivos**
    - **Valida: Requisitos 3.3, 4.3**
    - `// Feature: dvd-catalog, Property 3: Validación rechaza números no positivos`

  - [x] 4.3 Crear hook `useNextNumero` que consulte `GET /api/dvds/next-numero`
    - _Requisitos: 4.1_

- [x] 5. Componente `DvdForm` — campo número
  - Añadir campo `numero` al formulario de creación y edición de DVDs
  - En creación: pre-rellenar con el valor de `useNextNumero`
  - En edición: pre-rellenar con el valor actual del DVD
  - Mostrar mensaje de error cuando el número ya está en uso (respuesta 409 de la API)
  - _Requisitos: 3.1, 4.1, 4.2_

- [x] 6. Componente `DvdCard` — visualización del número
  - Añadir badge/etiqueta con el número de película en la tarjeta del DVD
  - Implementar función `formatNumero(numero, total)` con padding de ceros a la izquierda
  - _Requisitos: 2.1, 2.4_

  - [ ]* 6.1 Escribir test de propiedad para el formato con padding correcto
    - **Propiedad 7: Formato con padding correcto según tamaño de colección**
    - **Valida: Requisito 2.4**
    - `// Feature: dvd-catalog, Property 7: Formato con padding correcto`

- [x] 7. Catálogo — ordenación y búsqueda por número
  - [x] 7.1 Actualizar el Catálogo_View para ordenar por `numero` ASC por defecto y añadir opción de ordenación ASC/DESC
    - _Requisitos: 2.2, 2.3_

  - [ ]* 7.2 Escribir test de propiedad para orden numérico correcto
    - **Propiedad 4: Orden numérico correcto en el catálogo**
    - **Valida: Requisitos 2.2, 2.3, 5.2**
    - `// Feature: dvd-catalog, Property 4: Orden numérico correcto en el catálogo`

  - [x] 7.3 Actualizar la lógica de búsqueda del catálogo para incluir el campo `numero` como criterio de búsqueda
    - _Requisitos: 5.1, 5.2_

  - [ ]* 7.4 Escribir test de propiedad para búsqueda por número
    - **Propiedad 6: Búsqueda por número devuelve coincidencias exactas**
    - **Valida: Requisito 5.1**
    - `// Feature: dvd-catalog, Property 6: Búsqueda por número devuelve coincidencias exactas`

- [x] 8. Integridad al eliminar DVDs
  - Verificar que la lógica de eliminación existente no reasigna números
  - Confirmar que `get_next_dvd_numero` retorna `MAX(numero)+1` después de una eliminación
  - _Requisitos: 6.1, 6.2, 6.3_

  - [ ]* 8.1 Escribir test de propiedad para eliminación sin afectar otros números
    - **Propiedad 5: Eliminación no afecta números de otros DVDs**
    - **Valida: Requisito 6.1**
    - `// Feature: dvd-catalog, Property 5: Eliminación no afecta números de otros DVDs`

- [x] 9. Checkpoint final — Verificar que todos los tests pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los tests de propiedad usan **fast-check** con mínimo 100 iteraciones por propiedad
- La constraint `UNIQUE(user_id, numero)` en Supabase es la garantía definitiva de unicidad; la validación en cliente y API son capas adicionales de UX

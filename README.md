# Studify

Studify es una aplicacion para estudiantes enfocada en organizar el tiempo de estudio, preparar examenes, registrar progreso y trabajar con apuntes mediante un asistente IA.

## Estado actual

El proyecto esta armado como una app React con Vite. Esta version ya funciona como un MVP local:

- Login y registro visual con fallback local.
- Login y registro reales con Supabase Auth cuando existen variables `.env.local`.
- Dashboard con resumen semanal, racha, sesiones y apuntes guardados.
- Plan de Hoy calculado desde el examen mas urgente, temas pendientes y horas restantes.
- Materias creadas, editadas y eliminadas desde el perfil.
- Apuntes creados, editados, borrados y filtrados por materia.
- Pomodoro interactivo con registro de sesiones de estudio.
- Historial de sesiones con carga manual, edicion y eliminacion.
- Estadisticas calculadas desde las sesiones guardadas.
- Creacion, edicion y eliminacion de examenes con fecha, materia y lista de temas.
- Cliente Supabase preparado para auth, base de datos y storage de archivos.
- Helper `uploadStudyFile` preparado para subir PDF/DOC al bucket `study-files`.
- Persistencia actual de datos de estudio en el navegador mediante `localStorage`.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Supabase

El proyecto ya incluye:

- `.env.example` con las variables necesarias.
- `src/lib/supabaseClient.js` para crear el cliente de Supabase.
- `src/lib/studyFiles.js` para preparar/subir archivos de estudio.
- `supabase/schema.sql` con tablas iniciales, RLS y bucket `study-files` para PDFs/DOCs.

Para conectar Supabase:

1. Crear un proyecto en Supabase.
2. Copiar `.env.example` como `.env.local`.
3. Completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Ejecutar el SQL de `supabase/schema.sql` en el editor SQL de Supabase.
5. Probar registro/login desde la app.

## Demo con GitHub Pages

El repositorio incluye `.github/workflows/deploy.yml`. Para publicar la demo:

1. Ir a `Settings` > `Pages` en GitHub.
2. En `Build and deployment`, elegir `GitHub Actions`.
3. Ejecutar el workflow `Deploy Studify` o hacer un nuevo push a `main`.

Cuando termine, la demo deberia quedar disponible en:

```text
https://brunobusnelli.github.io/Studify/
```

## Proximos pasos sugeridos

1. Conectar el selector visual de PDF/DOC en Mis Apuntes con `uploadStudyFile`.
2. Migrar materias, apuntes, sesiones y examenes desde `localStorage` a Supabase.
3. Guardar registros de apuntes en la tabla `notes` junto al `file_path` de Storage.
4. Extraer texto de archivos y conectar resumen/preguntas con IA.
5. Separar componentes por carpeta cuando crezca la app.

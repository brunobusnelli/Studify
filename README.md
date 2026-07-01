# Studify

Studify es una aplicacion para estudiantes enfocada en organizar el tiempo de estudio, preparar examenes, registrar progreso y trabajar con apuntes mediante un asistente IA.

## Estado actual

El proyecto esta armado como una app React con Vite. Esta version ya funciona como un MVP local:

- Login y registro visual con fallback local.
- Login y registro reales con Supabase Auth cuando existen variables `.env.local`.
- Dashboard con resumen semanal, racha, sesiones y apuntes guardados.
- Plan de Hoy calculado desde el examen mas urgente, temas pendientes y horas restantes.
- Materias creadas, editadas y eliminadas desde el perfil.
- Apuntes creados, editados, borrados, filtrados por materia y cargados desde PDF/DOC/DOCX.
- Pomodoro interactivo con registro de sesiones de estudio.
- Historial de sesiones con carga manual, edicion y eliminacion.
- Estadisticas calculadas desde las sesiones guardadas.
- Creacion, edicion y eliminacion de examenes con fecha, materia y lista de temas.
- Cliente Supabase preparado para auth, base de datos y storage de archivos.
- Selector de archivos conectado a `uploadStudyFile` para subir PDF/DOC al bucket `study-files` cuando hay sesion Supabase.
- Asistente IA conectado a una Supabase Edge Function preparada para consultar Gemini con el apunte seleccionado.
- Respuestas de IA guardadas en Supabase para conservar los resultados generados.
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

`.env.local` queda ignorado por Git porque contiene configuracion local del proyecto.

### Asistente IA con Gemini

El asistente usa `supabase/functions/study-assistant`. La clave de Gemini no va en `.env.local` ni en el frontend: se guarda como secret de Supabase.

Para activarlo:

```bash
supabase secrets set GEMINI_API_KEY=tu_clave_de_gemini
supabase secrets set GEMINI_MODEL=gemini-3.5-flash
supabase functions deploy study-assistant
```

`GEMINI_MODEL` es opcional; si no esta configurado, la funcion usa `gemini-3.5-flash`.

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

1. Migrar materias, apuntes, sesiones y examenes desde `localStorage` a Supabase.
2. Guardar registros de apuntes en la tabla `notes` junto al `file_path` de Storage.
3. Probar el asistente IA desplegado con Gemini y ajustar prompts por tecnica de estudio.
4. Separar componentes por carpeta cuando crezca la app.

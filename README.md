# Studify

Studify es una aplicacion web para estudiantes que centraliza la organizacion del estudio: materias, apuntes, examenes, sesiones Pomodoro, estadisticas y asistencia con IA sobre archivos de estudio.

## MVP

Esta version esta pensada para presentar el proyecto con deploy funcionando y Supabase activo.

Funcionalidades incluidas:

- Login y registro con Supabase Auth.
- Fallback local si no hay variables de Supabase configuradas.
- Dashboard con horas de estudio, racha, sesiones, apuntes y plan del dia.
- Materias creadas, editadas y eliminadas desde el perfil.
- Apuntes creados, editados, filtrados y eliminados.
- Subida de archivos PDF, DOC y DOCX a Supabase Storage.
- Apertura de archivos mediante URL firmada.
- Asistente IA conectado a una Supabase Edge Function con Gemini.
- Resumen, explicacion y generacion de preguntas desde un apunte.
- Historial de respuestas IA guardado en Supabase.
- Registro de sesiones de estudio desde Pomodoro y desde respuestas IA.
- Estadisticas semanales calculadas desde las sesiones guardadas.
- Calendario de examenes con temas pendientes y progreso.
- Persistencia remota de materias, apuntes, sesiones y examenes en Supabase.

## Stack

- React
- Vite
- Supabase Auth
- Supabase Database
- Supabase Storage
- Supabase Edge Functions
- Gemini API
- Lucide React

## Desarrollo local

Instalar dependencias:

```bash
npm install
```

Crear `.env.local` desde `.env.example`:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Levantar la app:

```bash
npm run dev
```

Build de produccion:

```bash
npm run build
```

## Supabase

El proyecto incluye `supabase/schema.sql` con:

- Tablas `subjects`, `notes`, `exams`, `study_sessions` y `assistant_responses`.
- Row Level Security para que cada usuario vea solo sus datos.
- Bucket privado `study-files`.
- Politicas de Storage para subir, leer y borrar archivos del usuario.

Para preparar Supabase:

1. Crear un proyecto en Supabase.
2. Ejecutar `supabase/schema.sql` en SQL Editor.
3. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en local y en el deploy.
4. Verificar que el bucket `study-files` exista.
5. Probar registro, login, carga de materia y subida de apunte.

## Asistente IA con Gemini

La IA usa la Edge Function:

```text
supabase/functions/study-assistant
```

La clave de Gemini no se guarda en el frontend. Se configura como secret de Supabase:

```bash
supabase secrets set GEMINI_API_KEY=tu_clave_de_gemini
supabase secrets set GEMINI_MODEL=gemini-3.5-flash
supabase functions deploy study-assistant
```

El flujo de IA es:

1. El usuario elige un apunte.
2. La app llama a la Edge Function.
3. La funcion descarga el archivo desde Supabase Storage.
4. Gemini genera resumen, explicacion o preguntas.
5. La respuesta queda guardada en `assistant_responses`.

## Deploy

El proyecto esta preparado para deploy con GitHub Pages mediante GitHub Actions.

URL esperada:

```text
https://brunobusnelli.github.io/Studify/
```

Para que el deploy funcione con Supabase, configurar estos secrets/variables en GitHub Actions:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Guia de presentacion

Orden sugerido para mostrar el MVP:

1. Iniciar sesion con Supabase.
2. Mostrar el dashboard y el Plan de Hoy.
3. Crear o mostrar una materia.
4. Subir un apunte PDF/DOC/DOCX.
5. Abrir el apunte guardado.
6. Usar IA para resumir o explicar el apunte.
7. Mostrar historial de respuestas IA.
8. Registrar una sesion de estudio.
9. Mostrar estadisticas.
10. Crear un examen con temas pendientes.
11. Mostrar la recomendacion de estudio para el examen cercano.

## Checklist final del MVP

- [ ] Deploy abre correctamente.
- [ ] Login y registro funcionan.
- [ ] Los datos persisten al recargar.
- [ ] Se puede crear una materia.
- [ ] Se puede subir y abrir un archivo.
- [ ] La IA responde usando Gemini.
- [ ] Las respuestas IA quedan guardadas.
- [ ] Pomodoro registra sesiones.
- [ ] Estadisticas reflejan sesiones.
- [ ] Calendario muestra examen cercano y progreso.


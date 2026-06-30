# Studify

Studify es una aplicacion para estudiantes enfocada en organizar el tiempo de estudio, preparar examenes, registrar progreso y trabajar con apuntes mediante un asistente IA.

## Estado actual

El proyecto esta armado como una app React con Vite. Esta version ya funciona como un MVP local:

- Dashboard con resumen semanal, racha, sesiones y apuntes guardados.
- Materias editables desde el perfil.
- Apuntes creados, editados, borrados y filtrados por materia.
- Pomodoro interactivo con registro de sesiones de estudio.
- Estadisticas calculadas desde las sesiones guardadas.
- Examen cercano con temas pendientes, progreso, horas estimadas y recomendacion diaria.
- Creacion, edicion y eliminacion de examenes con fecha, materia y lista de temas.
- Tecnicas de estudio recomendadas.
- Vista inicial de asistente IA para resumir, explicar y crear preguntas.
- Persistencia en el navegador mediante `localStorage`.
- Workflow de GitHub Actions para publicar en GitHub Pages.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

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

1. Agregar edicion y eliminacion de materias y sesiones.
2. Separar componentes por carpeta cuando crezca la app.
3. Agregar autenticacion de usuarios.
4. Guardar materias, apuntes, sesiones y examenes en una base de datos.
5. Integrar carga real de PDFs y resumen con IA.

# Studify

Studify es una aplicacion para estudiantes enfocada en organizar el tiempo de estudio, preparar examenes, registrar progreso y trabajar con apuntes mediante un asistente IA.

## Estado actual

El proyecto ya esta armado como una app React con Vite. La primera version incluye:

- Dashboard con resumen semanal, racha, sesiones y apuntes guardados.
- Vista de apuntes con filtros por materia.
- Pomodoro interactivo de 25 minutos.
- Estadisticas semanales y tiempo por materia.
- Calendario de sesiones de estudio.
- Tecnicas de estudio recomendadas.
- Vista inicial de asistente IA para resumir, explicar y crear preguntas.
- Perfil del estudiante con progreso general.
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

1. Separar componentes por carpeta cuando crezca la app.
2. Agregar autenticacion de usuarios.
3. Guardar materias, apuntes, sesiones y examenes en una base de datos.
4. Integrar carga de PDFs y resumen con IA.
5. Convertir los datos simulados en datos reales del usuario.

# Presentacion del MVP - Studify

## Idea principal

Studify es una aplicacion para estudiantes que ayuda a organizar el estudio, gestionar apuntes, planificar examenes y usar IA para estudiar mejor a partir de archivos PDF, DOC o DOCX.

## Problema

Muchos estudiantes tienen apuntes, fechas de examen, sesiones de estudio y tecnicas de repaso repartidas en distintas herramientas. Eso hace dificil saber que estudiar, cuanto falta y como avanzar.

## Solucion

Studify centraliza el flujo de estudio en una sola app:

- Materias y apuntes organizados.
- Pomodoro para registrar tiempo real de estudio.
- Estadisticas para medir progreso.
- Calendario de examenes con temas pendientes.
- IA para resumir, explicar y generar preguntas desde apuntes.

## Tecnologias usadas

- React y Vite para el frontend.
- Supabase Auth para login y registro.
- Supabase Database para guardar datos del usuario.
- Supabase Storage para archivos.
- Supabase Edge Functions para conectar la IA.
- Gemini API para analizar los apuntes.

## Division de trabajo sugerida

Bruno:

- Integracion con Supabase.
- Subida y apertura de archivos.
- Conexion de Gemini.
- Persistencia de datos.
- Refactor de componentes.
- Deploy.

Companero:

- Revision visual responsive.
- Pruebas funcionales.
- Documentacion.
- Capturas para la presentacion.
- Armado del tablero Trello.
- Testing de flujos principales.

## Flujo para mostrar en vivo

1. Abrir el deploy.
2. Iniciar sesion con una cuenta de prueba.
3. Mostrar el dashboard principal.
4. Ir a Perfil y mostrar materias.
5. Ir a Mis Apuntes y subir o abrir un archivo.
6. Ir a IA Asistente y generar un resumen.
7. Mostrar el historial de respuestas IA.
8. Registrar una sesion Pomodoro.
9. Mostrar Estadisticas.
10. Crear o mostrar un examen cercano.
11. Explicar el Plan de Hoy y los temas pendientes.

## Cuenta demo

Antes de presentar, conviene preparar una cuenta con:

- 2 materias.
- 2 apuntes subidos.
- 1 resumen IA generado.
- 2 sesiones de estudio.
- 1 examen cercano con temas pendientes.

## Checklist antes de presentar

- [ ] El deploy abre correctamente.
- [ ] El deploy muestra Supabase, no Demo local.
- [ ] Login y registro funcionan.
- [ ] Los datos siguen al recargar.
- [ ] Se puede subir un archivo.
- [ ] Se puede abrir el archivo subido.
- [ ] La IA responde con Gemini.
- [ ] La respuesta IA queda en historial.
- [ ] Pomodoro registra sesiones.
- [ ] Las estadisticas cambian con las sesiones.
- [ ] El calendario muestra examenes y progreso.


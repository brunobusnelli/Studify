const notes = [
  ["Fisiologia Humana - Unidad 2", "Biologia", "21/05/2024", "2.4 MB", "pdf"],
  ["Calculo Integral - Resumen", "Matematica", "19/05/2024", "1.8 MB", "pdf"],
  ["Historia Argentina - Siglo XIX", "Historia", "18/05/2024", "3.1 MB", "pdf"],
  ["Quimica Organica - Compuestos", "Quimica", "17/05/2024", "2.7 MB", "pdf"],
  ["Teoria Celular - Apuntes", "Biologia", "15/05/2024", "1.2 MB", "doc"],
  ["Fisica - Leyes de Newton", "Fisica", "14/05/2024", "2.0 MB", "pdf"],
  ["Literatura - Modernismo", "Literatura", "12/05/2024", "1.6 MB", "pdf"]
];

const techniques = [
  ["🍅", "Pomodoro", "25 minutos de enfoque + 5 minutos de descanso. Ideal para mantener la concentracion."],
  ["🧠", "Tecnica Feynman", "Aprende explicando el tema con tus propias palabras de forma simple."],
  ["🗒️", "Mapas Mentales", "Organiza ideas visualmente para comprender mejor los conceptos."],
  ["📚", "Active Recall", "Practica recordar sin mirar los apuntes para fijar informacion."],
  ["🧩", "Spaced Repetition", "Repasa en intervalos para recordar durante mas tiempo."]
];

const titles = {
  home: ["¡Hola, Usuario! 👋", "La disciplina de hoy es el exito de mañana."],
  notes: ["Mis Apuntes", "Organiza, filtra y consulta tus materiales."],
  stats: ["Estadisticas", "Mira como avanza tu estudio esta semana."],
  pomodoro: ["Pomodoro", "Enfocate por bloques y registra tus sesiones."],
  techniques: ["Tecnicas de Estudio", "Elige el metodo adecuado para cada objetivo."],
  assistant: ["IA Asistente", "Resume, explica y practica con tus apuntes."],
  calendar: ["Calendario", "Planifica tus sesiones y examenes cercanos."],
  profile: ["Perfil", "Tu actividad y logros de estudio."]
};

function noteRow(note) {
  const [title, subject, date, size, type] = note;
  return `<article class="document-row"><span class="file-icon ${type === "doc" ? "doc" : ""}">${type.toUpperCase()}</span><div><strong>${title}</strong><small>${subject} · ${date} · ${size}</small></div><button aria-label="Mas opciones">...</button></article>`;
}

function renderNotes() {
  document.querySelector("#recentNotes").innerHTML = notes.slice(0, 4).map(noteRow).join("");
  document.querySelector("#allNotes").innerHTML = notes.map(noteRow).join("");
}

function renderTechniques() {
  document.querySelector("#techniqueList").innerHTML = techniques.map(([emoji, title, body]) => (
    `<article class="technique-row"><span class="technique-emoji">${emoji}</span><div><strong>${title}</strong><p>${body}</p></div><button aria-label="Abrir tecnica">›</button></article>`
  )).join("");
}

function renderCalendar() {
  const days = [29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 1, 2];
  document.querySelector("#calendarGrid").innerHTML = days.map((day, index) => {
    const muted = index < 2 || index > 32 ? "muted-day" : "";
    const selected = day === 21 && index === 22 ? "selected" : "";
    return `<span class="${muted} ${selected}">${day}</span>`;
  }).join("");
}

function setView(viewId) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === viewId));
  const [title, subtitle] = titles[viewId] || titles.home;
  document.querySelector("#pageTitle").textContent = title;
  document.querySelector("#pageSubtitle").textContent = subtitle;
  document.querySelector(".sidebar").classList.remove("open");
}

let seconds = 25 * 60;
let running = false;
let intervalId;

function formatTime(value) {
  const minutes = String(Math.floor(value / 60)).padStart(2, "0");
  const secs = String(value % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function updateTimer() {
  document.querySelectorAll("#homeTimer, #mainTimer").forEach(timer => timer.textContent = formatTime(seconds));
  const progress = 100 - Math.round((seconds / (25 * 60)) * 100);
  document.querySelectorAll(".timer-ring").forEach(ring => ring.style.setProperty("--progress", Math.max(8, progress)));
}

function toggleTimer() {
  running = !running;
  document.querySelectorAll("#homeStart, #mainStart").forEach(button => button.textContent = running ? "⏸ Pausar" : "▶ Iniciar");
  if (running) {
    intervalId = setInterval(() => {
      seconds = Math.max(0, seconds - 1);
      updateTimer();
      if (seconds === 0) toggleTimer();
    }, 1000);
  } else {
    clearInterval(intervalId);
  }
}

document.addEventListener("click", event => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) setView(viewButton.dataset.view);
});

document.querySelector("#menuButton").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
document.querySelectorAll("#homeStart, #mainStart").forEach(button => button.addEventListener("click", toggleTimer));
document.querySelector("#resetTimer").addEventListener("click", () => { seconds = 25 * 60; running = false; clearInterval(intervalId); document.querySelectorAll("#homeStart, #mainStart").forEach(button => button.textContent = "▶ Iniciar"); updateTimer(); });
document.querySelectorAll(".ask-form").forEach(form => form.addEventListener("submit", event => { event.preventDefault(); const input = form.querySelector("input"); input.value = ""; input.placeholder = "Listo, el asistente esta preparando una respuesta..."; }));

renderNotes();
renderTechniques();
renderCalendar();
updateTimer();

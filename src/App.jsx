import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Bell, BookOpen, Brain, CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
  Clock3, FileText, Flame, FolderOpen, GraduationCap, Home, Lightbulb, Menu, Moon,
  MoreHorizontal, Pause, Play, Plus, RotateCcw, Search, Send, Sparkles, Target,
  TimerReset, Trophy, Upload, User, X
} from 'lucide-react';

const initialData = {
  subjects: [
    { id: 'bio', name: 'Biologia', color: 'green', targetHours: 8 },
    { id: 'math', name: 'Matematica', color: 'purple', targetHours: 7 },
    { id: 'history', name: 'Historia', color: 'orange', targetHours: 5 },
    { id: 'chem', name: 'Quimica', color: 'blue', targetHours: 6 }
  ],
  notes: [
    { id: 'n1', title: 'Fisiologia Humana - Unidad 2', subject: 'Biologia', date: '2024-05-21', size: '2.4 MB', type: 'PDF' },
    { id: 'n2', title: 'Calculo Integral - Resumen', subject: 'Matematica', date: '2024-05-19', size: '1.8 MB', type: 'PDF' },
    { id: 'n3', title: 'Historia Argentina - Siglo XIX', subject: 'Historia', date: '2024-05-18', size: '3.1 MB', type: 'PDF' },
    { id: 'n4', title: 'Quimica Organica - Compuestos', subject: 'Quimica', date: '2024-05-17', size: '2.7 MB', type: 'PDF' }
  ],
  exams: [
    { id: 'e1', subject: 'Biologia', title: 'Parcial de Biologia Celular', date: '2026-07-08', topics: ['Membrana celular', 'Organelos', 'Transporte celular'], completedTopics: ['Membrana celular'], estimatedHours: 9 },
    { id: 'e2', subject: 'Matematica', title: 'Integrales y aplicaciones', date: '2026-07-15', topics: ['Integrales definidas', 'Area bajo la curva', 'Sustitucion'], completedTopics: ['Integrales definidas'], estimatedHours: 7 }
  ],
  sessions: [
    { id: 's1', subject: 'Biologia', minutes: 50, date: '2026-06-27' },
    { id: 's2', subject: 'Matematica', minutes: 75, date: '2026-06-28' },
    { id: 's3', subject: 'Historia', minutes: 35, date: '2026-06-28' }
  ]
};

const techniques = [
  [TimerReset, 'Pomodoro', '25 minutos de enfoque y 5 minutos de descanso para sostener la concentracion.'],
  [Brain, 'Tecnica Feynman', 'Explica el tema con palabras simples para detectar lo que falta entender.'],
  [BookOpen, 'Mapas mentales', 'Conecta conceptos visualmente para recordar relaciones e ideas clave.'],
  [Target, 'Active recall', 'Practica recordar sin mirar los apuntes y revisa donde fallaste.'],
  [CalendarDays, 'Repeticion espaciada', 'Agenda repasos separados para retener informacion por mas tiempo.']
];

const views = {
  home: ['Hola, Usuario', 'La disciplina de hoy es el exito de manana.'],
  notes: ['Mis Apuntes', 'Carga materiales y organizalos por materia.'],
  stats: ['Estadisticas', 'Mira como avanza tu estudio esta semana.'],
  pomodoro: ['Pomodoro', 'Enfocate por bloques y registra tus sesiones.'],
  techniques: ['Tecnicas de Estudio', 'Elige el metodo adecuado para cada objetivo.'],
  assistant: ['IA Asistente', 'Resume, explica y practica con tus apuntes.'],
  calendar: ['Examenes y Calendario', 'Planifica sesiones segun lo que falta estudiar.'],
  profile: ['Perfil', 'Tus materias, actividad y logros de estudio.']
};

const nav = [
  ['home', 'Inicio', Home], ['notes', 'Mis Apuntes', FileText], ['stats', 'Estadisticas', BarChart3],
  ['pomodoro', 'Pomodoro', Clock3], ['techniques', 'Tecnicas', Lightbulb], ['assistant', 'IA Asistente', Sparkles],
  ['calendar', 'Examenes', CalendarDays], ['profile', 'Perfil', User]
];

const week = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStoredData() {
  if (typeof window === 'undefined') return initialData;
  try {
    const stored = window.localStorage.getItem('studify-data');
    return stored ? JSON.parse(stored) : initialData;
  } catch {
    return initialData;
  }
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function formatTime(value) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function daysUntil(value) {
  const today = new Date(todayISO());
  const target = new Date(`${value}T00:00:00`);
  return Math.max(0, Math.ceil((target - today) / 86400000));
}

function getWeeklyBars(sessions) {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  sessions.forEach(session => {
    const day = new Date(`${session.date}T00:00:00`).getDay();
    const index = day === 0 ? 6 : day - 1;
    totals[index] += session.minutes / 60;
  });
  const max = Math.max(...totals, 1);
  return totals.map(value => Math.max(6, Math.round((value / max) * 92)));
}

function useStudyData() {
  const [data, setData] = useState(readStoredData);

  useEffect(() => {
    window.localStorage.setItem('studify-data', JSON.stringify(data));
  }, [data]);

  const addNote = useCallback((note) => setData(current => ({ ...current, notes: [{ id: uid('note'), date: todayISO(), size: 'Manual', type: 'PDF', ...note }, ...current.notes] })), []);
  const addSubject = useCallback((subject) => setData(current => ({ ...current, subjects: [{ id: uid('subject'), color: 'purple', targetHours: 5, ...subject }, ...current.subjects] })), []);
  const addExam = useCallback((exam) => setData(current => ({ ...current, exams: [{ id: uid('exam'), completedTopics: [], ...exam }, ...current.exams] })), []);
  const addSession = useCallback((session) => setData(current => ({ ...current, sessions: [{ id: uid('session'), date: todayISO(), ...session }, ...current.sessions] })), []);
  const toggleTopic = useCallback((examId, topic) => setData(current => ({
    ...current,
    exams: current.exams.map(exam => {
      if (exam.id !== examId) return exam;
      const exists = exam.completedTopics.includes(topic);
      return { ...exam, completedTopics: exists ? exam.completedTopics.filter(item => item !== topic) : [...exam.completedTopics, topic] };
    })
  })), []);

  return { data, addNote, addSubject, addExam, addSession, toggleTopic };
}

function IconButton({ label, children, onClick }) {
  return <button className="icon-button" aria-label={label} title={label} onClick={onClick}>{children}</button>;
}

function Sidebar({ active, open, changeView, close }) {
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="sidebar-top">
      <div className="brand"><span className="brand-mark"><GraduationCap size={28} /></span><div><strong>Studify</strong><span>Tu estudio, mejor organizado.</span></div></div>
      <IconButton label="Cerrar menu" onClick={close}><X size={18} /></IconButton>
    </div>
    <nav className="side-nav">{nav.map(([id, label, Icon]) => <button className={`nav-item ${active === id ? 'active' : ''}`} key={id} onClick={() => changeView(id)}><Icon size={21} /><span>{label}</span></button>)}</nav>
    <div className="profile-mini"><div className="avatar"><User size={24} /></div><div><strong>Usuario</strong><span>estudiante@mail.com</span></div><ChevronDown size={18} /></div>
  </aside>;
}

function Header({ active, openMenu, changeView }) {
  const [title, subtitle] = views[active];
  return <header className="topbar">
    <IconButton label="Abrir menu" onClick={openMenu}><Menu size={22} /></IconButton>
    <div className="title-block"><h1>{title}{active === 'home' ? '!' : ''}</h1><p>{subtitle}</p></div>
    <div className="top-actions"><IconButton label="Notificaciones"><Bell size={20} /></IconButton><IconButton label="Modo oscuro"><Moon size={20} /></IconButton><button className="primary-button" onClick={() => changeView('notes')}><Plus size={18} />Nuevo Apunte</button></div>
  </header>;
}

function Metric({ icon: Icon, tone, label, value, detail }) {
  return <article className="metric-card"><span className={`metric-icon ${tone}`}><Icon size={28} /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>;
}

function NoteRow({ note }) {
  return <article className="document-row"><span className={`file-icon ${note.type === 'DOC' ? 'doc' : ''}`}>{note.type}</span><div><strong>{note.title}</strong><small>{note.subject} · {formatDate(note.date)} · {note.size}</small></div><button aria-label="Mas opciones"><MoreHorizontal size={20} /></button></article>;
}

function BarChart({ bars, tall = false }) {
  return <div className={`bar-chart ${tall ? 'tall' : ''}`}>{bars.map((height, index) => <span key={week[index]} style={{ '--h': `${height}%` }}>{week[index]}</span>)}</div>;
}

function TimerRing({ seconds, large }) {
  const progress = Math.max(8, 100 - Math.round((seconds / 1500) * 100));
  return <div className={`timer-ring ${large ? 'large' : ''}`} style={{ '--progress': progress }}><span>{formatTime(seconds)}</span><small>Tiempo de estudio</small></div>;
}\n
function QuickForm({ title, children, onSubmit }) {
  return <form className="quick-form" onSubmit={onSubmit}><h3>{title}</h3>{children}<button className="primary-button" type="submit"><Plus size={17} />Guardar</button></form>;
}

function ExamFocus({ exam, toggleTopic }) {
  if (!exam) return <section className="panel focus-panel"><h2>No hay examenes cargados</h2><p>Agrega un examen para ver una recomendacion diaria.</p></section>;
  const done = exam.completedTopics.length;
  const total = Math.max(exam.topics.length, 1);
  const progress = Math.round((done / total) * 100);
  const remaining = Math.max(exam.estimatedHours - done * 2, 1);
  return <section className="panel focus-panel">
    <div className="panel-heading"><h2>Examen cercano</h2><span className="status-pill">Faltan {daysUntil(exam.date)} dias</span></div>
    <strong>{exam.title}</strong><p>{exam.subject} · {formatDate(exam.date)}</p>
    <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
    <small>{progress}% preparado · quedan aprox. {remaining} h</small>
    <h3>Que estudiar hoy</h3>
    <ul className="topic-list">{exam.topics.map(topic => <li key={topic}><label><input type="checkbox" checked={exam.completedTopics.includes(topic)} onChange={() => toggleTopic(exam.id, topic)} />{topic}</label></li>)}</ul>
  </section>;
}

function AssistantStrip() {
  const [sent, setSent] = useState(false);
  return <section className="panel assistant-strip"><h2><Sparkles size={20} />Asistente IA</h2><p>{sent ? 'Listo, el asistente esta preparando una respuesta.' : 'Preguntame lo que necesites sobre tus temas de estudio.'}</p><form className="ask-form" onSubmit={(event) => { event.preventDefault(); setSent(true); event.currentTarget.reset(); }}><input placeholder="Escribe tu pregunta aqui..." /><button type="submit" aria-label="Enviar"><Send size={20} /></button></form></section>;
}

function HomeView({ data, summary, seconds, running, toggleTimer, changeView, toggleTopic }) {
  return <section className="view active">
    <div className="today-card"><div><span>Horas de estudio esta semana</span><strong>{summary.hours} h</strong><button onClick={() => changeView('stats')}>Ver estadisticas <ChevronRight size={15} /></button></div><Clock3 size={34} /></div>
    <div className="metrics-grid"><Metric icon={Clock3} tone="purple" label="Horas de estudio" value={`${summary.hours} h`} detail="guardadas en este dispositivo" /><Metric icon={Target} tone="green" label="Sesiones completadas" value={summary.sessions} detail="registros de estudio" /><Metric icon={Flame} tone="orange" label="Racha actual" value={`${summary.streak} dias`} detail="sigue asi" /><Metric icon={FolderOpen} tone="blue" label="Apuntes guardados" value={data.notes.length} detail="documentos" /></div>
    <div className="dashboard-grid"><section className="panel notes-panel"><div className="panel-heading"><h2>Mis Apuntes Recientes</h2><button className="link-button" onClick={() => changeView('notes')}>Ver todos</button></div><div className="document-list compact">{data.notes.slice(0, 4).map(note => <NoteRow note={note} key={note.id} />)}</div></section><section className="panel timer-panel"><h2>Pomodoro</h2><TimerRing seconds={seconds} /><button className="primary-button wide" onClick={toggleTimer}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? 'Pausar' : 'Iniciar'}</button><button className="secondary-button wide" onClick={() => changeView('pomodoro')}><TimerReset size={18} />Sesiones</button></section><section className="side-stack"><ExamFocus exam={summary.nextExam} toggleTopic={toggleTopic} /><article className="panel technique-card"><span className="metric-icon green"><Lightbulb size={28} /></span><div><h2>Tecnica recomendada</h2><strong>Pomodoro</strong><p>Ideal para mantener el enfoque y mejorar tu productividad.</p><button className="secondary-button" onClick={() => changeView('techniques')}>Ver mas tecnicas</button></div></article></section></div>
    <AssistantStrip />
  </section>;
}

function NotesView({ data, addNote }) {
  const [subjectFilter, setSubjectFilter] = useState('Todos');
  const visible = subjectFilter === 'Todos' ? data.notes : data.notes.filter(note => note.subject === subjectFilter);
  return <section className="view active"><div className="content-grid"><div><div className="section-toolbar"><div className="tabs"><button className={subjectFilter === 'Todos' ? 'active' : ''} onClick={() => setSubjectFilter('Todos')}>Todos</button>{data.subjects.map(subject => <button className={subjectFilter === subject.name ? 'active' : ''} key={subject.id} onClick={() => setSubjectFilter(subject.name)}>{subject.name}</button>)}</div><div className="toolbar-actions"><button className="icon-button" aria-label="Buscar"><Search size={20} /></button><button className="primary-button"><Upload size={18} />Subir apunte</button></div></div><div className="panel document-list">{visible.map(note => <NoteRow note={note} key={note.id} />)}</div></div><div className="panel"><QuickForm title="Nuevo apunte" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); addNote({ title: form.get('title'), subject: form.get('subject'), type: form.get('type') }); event.currentTarget.reset(); }}><input name="title" required placeholder="Titulo del apunte" /><select name="subject">{data.subjects.map(subject => <option key={subject.id}>{subject.name}</option>)}</select><select name="type"><option>PDF</option><option>DOC</option><option>LINK</option></select></QuickForm></div></div></section>;
}

function PomodoroView({ data, seconds, running, toggleTimer, resetTimer, addSession }) {
  const [subject, setSubject] = useState(data.subjects[0]?.name || 'General');
  return <section className="view active"><div className="mobile-screen panel centered-screen"><div className="tabs full"><button className="active">Estudio</button><button>Descanso</button></div><TimerRing seconds={seconds} large /><select className="full-select" value={subject} onChange={event => setSubject(event.target.value)}>{data.subjects.map(item => <option key={item.id}>{item.name}</option>)}</select><button className="primary-button wide" onClick={toggleTimer}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? 'Pausar' : 'Iniciar'}</button><button className="secondary-button wide" onClick={resetTimer}><RotateCcw size={18} />Reiniciar</button><button className="secondary-button wide" onClick={() => addSession({ subject, minutes: 25 })}><Plus size={18} />Registrar sesion de 25 min</button><div className="session-summary"><div><strong>{data.sessions.length}</strong><span>Completadas</span></div><div><strong>{Math.round(data.sessions.reduce((total, item) => total + item.minutes, 0) / 60)} h</strong><span>Tiempo total</span></div></div></div></section>;
}

function StatsView({ data, summary }) {
  return <section className="view active"><div className="stats-layout"><section className="panel"><select className="full-select"><option>Esta semana</option></select><h2>Horas de estudio</h2><strong className="big-number">{summary.hours} h</strong><small className="positive">datos guardados localmente</small><BarChart bars={summary.bars} tall /></section><section className="panel"><h2>Tiempo por materia</h2><div className="donut" /><ul className="subject-list">{data.subjects.map(subject => <li key={subject.id}><span className={`dot ${subject.color}`} />{subject.name} <b>{summary.subjectHours[subject.name] || 0} h</b></li>)}</ul></section></div></section>;
}

function AssistantView({ data }) {
  return <section className="view active"><div className="panel ai-panel"><div className="sparkle"><Sparkles size={36} /></div><h2>En que puedo ayudarte hoy?</h2><div className="ai-actions"><button><div><strong>Resumir este PDF</strong><span>{data.notes.length} apuntes disponibles para conectar luego.</span></div><FileText size={22} /></button><button><div><strong>Explicarme un tema</strong><span>El asistente puede preparar explicaciones por materia.</span></div><Brain size={22} /></button><button><div><strong>Crear preguntas</strong><span>Genera preguntas de practica sobre tus temas.</span></div><BookOpen size={22} /></button></div><AssistantStrip /></div></section>;
}

function CalendarView({ data, addExam, toggleTopic }) {
  const nextExam = [...data.exams].sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  return <section className="view active"><div className="content-grid"><div><ExamFocus exam={nextExam} toggleTopic={toggleTopic} /><div className="panel exam-list"><h2>Todos los examenes</h2>{data.exams.map(exam => <article className="exam-card" key={exam.id}><div><strong>{exam.title}</strong><small>{exam.subject} · {formatDate(exam.date)} · faltan {daysUntil(exam.date)} dias</small></div><span>{Math.round((exam.completedTopics.length / Math.max(exam.topics.length, 1)) * 100)}%</span></article>)}</div></div><div className="panel"><QuickForm title="Nuevo examen" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); addExam({ title: form.get('title'), subject: form.get('subject'), date: form.get('date'), estimatedHours: Number(form.get('estimatedHours') || 5), topics: String(form.get('topics')).split(',').map(item => item.trim()).filter(Boolean) }); event.currentTarget.reset(); }}><input name="title" required placeholder="Nombre del examen" /><select name="subject">{data.subjects.map(subject => <option key={subject.id}>{subject.name}</option>)}</select><input name="date" required type="date" /><input name="estimatedHours" min="1" type="number" placeholder="Horas estimadas" /><textarea name="topics" required placeholder="Temas separados por coma" /></QuickForm></div></div></section>;
}

function TechniquesView() {
  return <section className="view active"><div className="panel techniques-list"><div className="tabs"><button className="active">Todas</button><button>Productividad</button><button>Memorizacion</button><button>Comprension</button></div>{techniques.map(([Icon, title, body]) => <article className="technique-row" key={title}><span className="technique-emoji"><Icon size={32} /></span><div><strong>{title}</strong><p>{body}</p></div><button aria-label="Abrir tecnica"><ChevronRight size={20} /></button></article>)}</div></section>;
}

function ProfileView({ data, addSubject, summary }) {
  return <section className="view active"><div className="content-grid"><div className="panel profile-panel"><div className="profile-head"><div className="avatar large"><User size={42} /></div><div><h2>Usuario</h2><p>estudiante@mail.com</p><button className="primary-button small">Editar perfil</button></div></div><div className="profile-stats"><p><Flame size={20} />Racha actual <b>{summary.streak} dias</b></p><p><Clock3 size={20} />Horas totales <b>{summary.totalHours} h</b></p><p><Target size={20} />Sesiones completadas <b>{data.sessions.length}</b></p><p><FolderOpen size={20} />Apuntes guardados <b>{data.notes.length}</b></p><p><BarChart3 size={20} />Materias <b>{data.subjects.length}</b></p><p><Trophy size={20} />Examenes <b>{data.exams.length}</b></p></div></div><div className="panel"><QuickForm title="Nueva materia" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); addSubject({ name: form.get('name'), targetHours: Number(form.get('targetHours') || 5), color: form.get('color') }); event.currentTarget.reset(); }}><input name="name" required placeholder="Nombre de la materia" /><input name="targetHours" min="1" type="number" placeholder="Horas objetivo" /><select name="color"><option value="purple">Violeta</option><option value="green">Verde</option><option value="orange">Naranja</option><option value="blue">Azul</option></select></QuickForm></div></div></section>;
}

export default function App() {
  const { data, addNote, addSubject, addExam, addSession, toggleTopic } = useStudyData();
  const [active, setActive] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [seconds, setSeconds] = useState(1500);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setSeconds(value => {
        if (value <= 1) {
          setRunning(false);
          addSession({ subject: data.subjects[0]?.name || 'General', minutes: 25 });
          return 1500;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, addSession, data.subjects]);

  const summary = useMemo(() => {
    const totalMinutes = data.sessions.reduce((total, item) => total + item.minutes, 0);
    const subjectHours = data.sessions.reduce((map, item) => ({ ...map, [item.subject]: Math.round(((map[item.subject] || 0) + item.minutes / 60) * 10) / 10 }), {});
    const exams = [...data.exams].sort((a, b) => new Date(a.date) - new Date(b.date));
    return {
      hours: Math.round((totalMinutes / 60) * 10) / 10,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      sessions: data.sessions.length,
      streak: Math.min(7, new Set(data.sessions.map(item => item.date)).size),
      subjectHours,
      bars: getWeeklyBars(data.sessions),
      nextExam: exams[0]
    };
  }, [data]);

  const changeView = (view) => { setActive(view); setMenuOpen(false); };
  const toggleTimer = () => setRunning(value => !value);
  const resetTimer = () => { setRunning(false); setSeconds(1500); };

  return <div className="app-shell"><Sidebar active={active} open={menuOpen} changeView={changeView} close={() => setMenuOpen(false)} /><main className="main-content"><Header active={active} openMenu={() => setMenuOpen(true)} changeView={changeView} />{active === 'home' && <HomeView data={data} summary={summary} seconds={seconds} running={running} toggleTimer={toggleTimer} changeView={changeView} toggleTopic={toggleTopic} />}{active === 'notes' && <NotesView data={data} addNote={addNote} />}{active === 'pomodoro' && <PomodoroView data={data} seconds={seconds} running={running} toggleTimer={toggleTimer} resetTimer={resetTimer} addSession={addSession} />}{active === 'stats' && <StatsView data={data} summary={summary} />}{active === 'assistant' && <AssistantView data={data} />}{active === 'calendar' && <CalendarView data={data} addExam={addExam} toggleTopic={toggleTopic} />}{active === 'techniques' && <TechniquesView />}{active === 'profile' && <ProfileView data={data} addSubject={addSubject} summary={summary} />}</main><nav className="bottom-nav">{nav.filter(([id]) => ['home', 'notes', 'pomodoro', 'stats', 'profile'].includes(id)).map(([id, label, Icon]) => <button className={`nav-item ${active === id ? 'active' : ''}`} key={id} onClick={() => changeView(id)}><Icon size={20} /><span>{label.replace('Mis ', '')}</span></button>)}</nav></div>;
}

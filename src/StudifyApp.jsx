import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Bell, BookOpen, Brain, CalendarDays, ChevronDown, ChevronRight, Clock3,
  ExternalLink, FileText, Flame, FolderOpen, GraduationCap, Home, Lightbulb, ListChecks, LoaderCircle, Menu, Moon,
  MoreHorizontal, Pause, Pencil, Play, Plus, Send, Sparkles, Sun, Target,
  TimerReset, Trash2, User, X
} from 'lucide-react';
import AssistantView from './components/AssistantView.jsx';
import CalendarView from './components/CalendarView.jsx';
import NotesView from './components/NotesView.jsx';
import PomodoroView from './components/PomodoroView.jsx';
import ProfileView from './components/ProfileView.jsx';
import { isSupabaseConfigured } from './lib/supabaseClient.js';
import {
  createRemoteExam, createRemoteNote, createRemoteSession, createRemoteSubject,
  deleteRemoteExam, deleteRemoteNote, deleteRemoteSession, deleteRemoteSubject,
  loadRemoteStudyData, updateRemoteExam, updateRemoteNote, updateRemoteSession,
  updateRemoteSubject
} from './lib/studyDataApi.js';
import { deleteStudyFile } from './lib/studyFiles.js';

const seed = {
  subjects: [
    { id: 'bio', name: 'Biologia', color: 'green', targetHours: 8 },
    { id: 'math', name: 'Matematica', color: 'purple', targetHours: 7 },
    { id: 'history', name: 'Historia', color: 'orange', targetHours: 5 },
    { id: 'chem', name: 'Quimica', color: 'blue', targetHours: 6 }
  ],
  notes: [
    { id: 'n1', title: 'Fisiologia Humana - Unidad 2', subject: 'Biologia', date: '2026-06-25', size: '2.4 MB', type: 'PDF' },
    { id: 'n2', title: 'Calculo Integral - Resumen', subject: 'Matematica', date: '2026-06-24', size: '1.8 MB', type: 'PDF' },
    { id: 'n3', title: 'Historia Argentina - Siglo XIX', subject: 'Historia', date: '2026-06-23', size: '3.1 MB', type: 'PDF' }
  ],
  exams: [
    { id: 'e1', title: 'Parcial de Biologia Celular', subject: 'Biologia', date: '2026-07-08', estimatedHours: 9, topics: ['Membrana celular', 'Organelos', 'Transporte celular'], completedTopics: ['Membrana celular'] },
    { id: 'e2', title: 'Integrales y aplicaciones', subject: 'Matematica', date: '2026-07-15', estimatedHours: 7, topics: ['Integrales definidas', 'Area bajo la curva', 'Sustitucion'], completedTopics: [] }
  ],
  sessions: [
    { id: 's1', subject: 'Biologia', minutes: 50, date: '2026-06-27' },
    { id: 's2', subject: 'Matematica', minutes: 75, date: '2026-06-28' },
    { id: 's3', subject: 'Historia', minutes: 35, date: '2026-06-28' }
  ]
};

const emptyStudyData = {
  subjects: [],
  notes: [],
  exams: [],
  sessions: []
};

const pages = {
  home: ['Hola', 'La disciplina de hoy es el exito de manana.'],
  plan: ['Plan de Hoy', 'Una guia concreta para avanzar sin perder foco.'],
  notes: ['Mis Apuntes', 'Carga materiales y organizalos por materia.'],
  stats: ['Estadisticas', 'Mira como avanza tu estudio esta semana.'],
  pomodoro: ['Pomodoro', 'Enfocate por bloques y registra tus sesiones.'],
  techniques: ['Tecnicas de Estudio', 'Elige el metodo adecuado para cada objetivo.'],
  assistant: ['IA Asistente', 'Resume, explica y practica con tus apuntes.'],
  calendar: ['Examenes y Calendario', 'Planifica sesiones segun lo que falta estudiar.'],
  profile: ['Perfil', 'Tus materias, actividad y logros de estudio.']
};

const nav = [
  ['home', 'Inicio', Home], ['plan', 'Plan de Hoy', ListChecks], ['notes', 'Mis Apuntes', FileText],
  ['stats', 'Estadisticas', BarChart3], ['pomodoro', 'Pomodoro', Clock3], ['techniques', 'Tecnicas', Lightbulb],
  ['assistant', 'IA Asistente', Sparkles], ['calendar', 'Examenes', CalendarDays], ['profile', 'Perfil', User]
];

const techniques = [
  { icon: TimerReset, title: 'Pomodoro', category: 'Productividad', body: '25 minutos de enfoque y 5 minutos de descanso.', bestFor: 'Ideal para arrancar cuando cuesta concentrarse.', steps: ['Elegir una tarea concreta', 'Estudiar 25 minutos sin interrupciones', 'Descansar 5 minutos', 'Registrar la sesion al terminar'] },
  { icon: Brain, title: 'Tecnica Feynman', category: 'Comprension', body: 'Explica un tema con palabras simples para descubrir dudas.', bestFor: 'Util para temas que parecen entendidos pero cuesta explicar.', steps: ['Elegir un concepto', 'Explicarlo como si fuera para otra persona', 'Detectar partes confusas', 'Volver al apunte y mejorar la explicacion'] },
  { icon: BookOpen, title: 'Mapas mentales', category: 'Memorizacion', body: 'Conecta conceptos visualmente para recordar relaciones clave.', bestFor: 'Sirve para unidades largas con muchos conceptos relacionados.', steps: ['Poner el tema central', 'Agregar ramas principales', 'Conectar ideas secundarias', 'Repasar mirando solo el mapa'] },
  { icon: Target, title: 'Active recall', category: 'Memorizacion', body: 'Practica recordar sin mirar tus apuntes.', bestFor: 'Muy bueno para preparar parciales y detectar huecos.', steps: ['Cerrar el apunte', 'Responder preguntas de memoria', 'Corregir con el material', 'Repetir los puntos fallados'] }
];

const techniqueFilters = ['Todas', 'Productividad', 'Memorizacion', 'Comprension'];

const week = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const formatTime = (value) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const formatDate = (value) => new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
const daysUntil = (value) => Math.max(0, Math.ceil((new Date(`${value}T00:00:00`) - new Date(`${today()}T00:00:00`)) / 86400000));
function readData() {
  try {
    return JSON.parse(localStorage.getItem('studify-data')) || seed;
  } catch {
    return seed;
  }
}

function buildDailyPlan(data) {
  const exams = [...data.exams].sort((a, b) => new Date(a.date) - new Date(b.date));
  const exam = exams.find((item) => item.topics.some((topic) => !item.completedTopics.includes(topic))) || exams[0];
  if (!exam) return null;
  const pendingTopics = exam.topics.filter((topic) => !exam.completedTopics.includes(topic));
  const topic = pendingTopics[0] || exam.topics[0] || 'Repaso general';
  const remainingHours = Math.max(exam.estimatedHours - exam.completedTopics.length * 2, 1);
  const days = Math.max(daysUntil(exam.date), 1);
  const dailyHours = Math.max(0.5, Math.round((remainingHours / days) * 10) / 10);
  const intensity = days <= 2 ? 'Alta prioridad' : days <= 7 ? 'Prioridad media' : 'Ritmo estable';
  const technique = days <= 3 ? 'Active recall' : pendingTopics.length > 1 ? 'Pomodoro' : 'Tecnica Feynman';
  const task = `Estudiar ${topic} durante ${dailyHours} h y cerrar con 10 minutos de repaso activo.`;
  return { exam, topic, dailyHours, remainingHours, days, intensity, technique, task, pendingTopics };
}

function IconButton({ label, children, onClick }) {
  return <button className="icon-button" aria-label={label} title={label} onClick={onClick}>{children}</button>;
}

function readTheme() {
  try {
    return localStorage.getItem('studify-theme') || 'light';
  } catch {
    return 'light';
  }
}

function useStudyData(user) {
  const remoteUserId = user?.provider === 'supabase' ? user.id : null;
  const startsRemote = isSupabaseConfigured && Boolean(remoteUserId);
  const [data, setData] = useState(() => (startsRemote ? emptyStudyData : readData()));
  const [sync, setSync] = useState(() => (
    startsRemote
      ? { provider: 'supabase', status: 'loading', message: 'Sincronizando con Supabase...' }
      : { provider: 'local', status: 'local', message: 'Datos guardados localmente.' }
  ));

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured || !remoteUserId) {
      setSync({ provider: 'local', status: 'local', message: 'Datos guardados localmente.' });
      return undefined;
    }

    setSync({ provider: 'supabase', status: 'loading', message: 'Sincronizando con Supabase...' });
    loadRemoteStudyData()
      .then((remote) => {
        if (!active || !remote) return;
        setData(remote.data);
        setSync({ provider: 'supabase', status: 'ready', message: 'Sincronizado con Supabase.' });
      })
      .catch((error) => {
        if (!active) return;
        setSync({ provider: 'local', status: 'error', message: error.message || 'No se pudo cargar Supabase.' });
      });

    return () => { active = false; };
  }, [remoteUserId]);

  useEffect(() => {
    if (sync.provider !== 'supabase') localStorage.setItem('studify-data', JSON.stringify(data));
  }, [data, sync.provider]);

  const remote = (task) => {
    if (!remoteUserId || sync.provider !== 'supabase') return;
    task().catch((error) => setSync({ provider: 'supabase', status: 'error', message: error.message || 'No se pudo guardar en Supabase.' }));
  };

  return {
    data,
    sync,
    addNote: (note) => setData((current) => {
      const localNote = { id: id('note'), date: today(), size: 'Manual', ...note };
      remote(async () => {
        const remoteId = await createRemoteNote(remoteUserId, current.subjects, localNote);
        setData((latest) => ({ ...latest, notes: latest.notes.map((item) => item.id === localNote.id ? { ...item, id: remoteId } : item) }));
      });
      return { ...current, notes: [localNote, ...current.notes] };
    }),
    updateNote: (noteId, patch) => setData((current) => {
      const original = current.notes.find((note) => note.id === noteId);
      remote(async () => {
        await updateRemoteNote(noteId, current.subjects, patch);
        if (patch.filePath && original?.filePath && patch.filePath !== original.filePath) {
          await deleteStudyFile(original.filePath);
        }
      });
      return { ...current, notes: current.notes.map((note) => note.id === noteId ? { ...note, ...patch } : note) };
    }),
    deleteNote: (noteId) => setData((current) => {
      const note = current.notes.find((item) => item.id === noteId);
      remote(async () => {
        await deleteRemoteNote(noteId);
        await deleteStudyFile(note?.filePath);
      });
      return { ...current, notes: current.notes.filter((item) => item.id !== noteId) };
    }),
    addSubject: (subject) => setData((current) => {
      const localSubject = { id: id('subject'), ...subject };
      remote(async () => {
        const remoteSubject = await createRemoteSubject(remoteUserId, localSubject);
        setData((latest) => ({ ...latest, subjects: latest.subjects.map((item) => item.id === localSubject.id ? remoteSubject : item) }));
      });
      return { ...current, subjects: [localSubject, ...current.subjects] };
    }),
    updateSubject: (subjectId, patch) => setData((current) => {
      const original = current.subjects.find((subject) => subject.id === subjectId);
      const nextName = patch.name || original?.name;
      remote(() => updateRemoteSubject(subjectId, patch));
      return {
        ...current,
        subjects: current.subjects.map((subject) => subject.id === subjectId ? { ...subject, ...patch } : subject),
        notes: current.notes.map((note) => note.subject === original?.name ? { ...note, subject: nextName } : note),
        exams: current.exams.map((exam) => exam.subject === original?.name ? { ...exam, subject: nextName } : exam),
        sessions: current.sessions.map((session) => session.subject === original?.name ? { ...session, subject: nextName } : session)
      };
    }),
    deleteSubject: (subjectId) => {
      setData((current) => ({ ...current, subjects: current.subjects.filter((subject) => subject.id !== subjectId) }));
      remote(() => deleteRemoteSubject(subjectId));
    },
    addExam: (exam) => setData((current) => {
      const localExam = { id: id('exam'), completedTopics: [], ...exam };
      remote(async () => {
        const remoteId = await createRemoteExam(remoteUserId, current.subjects, localExam);
        setData((latest) => ({ ...latest, exams: latest.exams.map((item) => item.id === localExam.id ? { ...item, id: remoteId } : item) }));
      });
      return { ...current, exams: [localExam, ...current.exams] };
    }),
    updateExam: (examId, patch) => setData((current) => {
      const nextExams = current.exams.map((exam) => exam.id === examId ? { ...exam, ...patch, completedTopics: exam.completedTopics.filter((topic) => patch.topics?.includes(topic) ?? true) } : exam);
      const nextExam = nextExams.find((exam) => exam.id === examId);
      remote(() => updateRemoteExam(examId, current.subjects, nextExam));
      return { ...current, exams: nextExams };
    }),
    deleteExam: (examId) => {
      setData((current) => ({ ...current, exams: current.exams.filter((exam) => exam.id !== examId) }));
      remote(() => deleteRemoteExam(examId));
    },
    addSession: (session) => setData((current) => {
      const localSession = { id: id('session'), date: today(), ...session };
      remote(async () => {
        const remoteId = await createRemoteSession(remoteUserId, current.subjects, localSession);
        setData((latest) => ({ ...latest, sessions: latest.sessions.map((item) => item.id === localSession.id ? { ...item, id: remoteId } : item) }));
      });
      return { ...current, sessions: [localSession, ...current.sessions] };
    }),
    updateSession: (sessionId, patch) => setData((current) => {
      remote(() => updateRemoteSession(sessionId, current.subjects, patch));
      return { ...current, sessions: current.sessions.map((session) => session.id === sessionId ? { ...session, ...patch } : session) };
    }),
    deleteSession: (sessionId) => {
      setData((current) => ({ ...current, sessions: current.sessions.filter((session) => session.id !== sessionId) }));
      remote(() => deleteRemoteSession(sessionId));
    },
    toggleTopic: (examId, topic) => setData((current) => ({
      ...current,
      exams: current.exams.map((exam) => {
        if (exam.id !== examId) return exam;
        const done = exam.completedTopics.includes(topic);
        const nextExam = { ...exam, completedTopics: done ? exam.completedTopics.filter((item) => item !== topic) : [...exam.completedTopics, topic] };
        remote(() => updateRemoteExam(examId, current.subjects, { completedTopics: nextExam.completedTopics }));
        return nextExam;
      })
    }))
  };
}

function Sidebar({ active, open, changeView, close, user }) {
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="sidebar-top">
      <div className="brand"><span className="brand-mark"><GraduationCap size={28} /></span><div><strong>Studify</strong><span>Tu estudio, mejor organizado.</span></div></div>
      <IconButton label="Cerrar menu" onClick={close}><X size={18} /></IconButton>
    </div>
    <nav className="side-nav">{nav.map(([key, label, Icon]) => <button className={`nav-item ${active === key ? 'active' : ''}`} key={key} onClick={() => changeView(key)}><Icon size={21} /><span>{label}</span></button>)}</nav>
    <div className="profile-mini"><div className="avatar"><User size={24} /></div><div><strong>{user?.name || 'Usuario'}</strong><span>{user?.email || 'estudiante@mail.com'}</span></div><ChevronDown size={18} /></div>
  </aside>;
}

function Header({ active, openMenu, changeView, sync, user, darkMode, toggleTheme }) {
  const [title, subtitle] = pages[active];
  const displayTitle = active === 'home' ? `${title}, ${user?.name || 'Usuario'}` : title;
  return <header className="topbar">
    <IconButton label="Abrir menu" onClick={openMenu}><Menu size={22} /></IconButton>
    <div className="title-block"><h1>{displayTitle}{active === 'home' ? '!' : ''}</h1><p>{subtitle}</p></div>
    <div className="top-actions"><span className={`sync-pill ${sync?.status || 'local'}`}>{sync?.provider === 'supabase' ? 'Supabase' : 'Local'}</span><IconButton label="Notificaciones"><Bell size={20} /></IconButton><IconButton label={darkMode ? 'Modo claro' : 'Modo oscuro'} onClick={toggleTheme}>{darkMode ? <Sun size={20} /> : <Moon size={20} />}</IconButton><button className="primary-button" onClick={() => changeView('notes')}><Plus size={18} />Nuevo Apunte</button></div>
  </header>;
}

function Metric({ icon: Icon, tone, label, value, detail }) {
  return <article className="metric-card"><span className={`metric-icon ${tone}`}><Icon size={28} /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>;
}

function RowActions({ onEdit, onDelete }) {
  return <div className="row-actions"><button type="button" onClick={onEdit} aria-label="Editar"><Pencil size={17} /></button><button type="button" onClick={onDelete} aria-label="Borrar"><Trash2 size={17} /></button></div>;
}

function NoteRow({ note, onEdit, onDelete }) {
  const storageLabel = note.storage === 'supabase' ? 'Supabase' : note.fileName ? 'archivo local' : 'manual';
  return <article className="document-row editable-row"><span className={`file-icon ${note.type === 'DOC' ? 'doc' : ''}`}>{note.type}</span><div><strong>{note.title}</strong><small>{note.subject} · {formatDate(note.date)} · {note.size} · {storageLabel}</small>{note.fileName ? <em>{note.fileName}</em> : null}</div>{onEdit ? <RowActions onEdit={onEdit} onDelete={onDelete} /> : <button aria-label="Mas opciones"><MoreHorizontal size={20} /></button>}</article>;
}

function NoteRowV2({ note, onEdit, onDelete, onOpen, onSelect, active = false }) {
  const storageLabel = note.storage === 'supabase' ? 'Supabase' : note.fileName ? 'archivo local' : 'manual';
  return <article className={`document-row editable-row ${active ? 'active' : ''}`} onClick={onSelect}><span className={`file-icon ${note.type === 'DOC' ? 'doc' : ''}`}>{note.type}</span><div><strong>{note.title}</strong><small>{note.subject} - {formatDate(note.date)} - {note.size} - {storageLabel}</small>{note.fileName ? <em>{note.fileName}</em> : null}</div>{onEdit ? <div className="row-actions">{note.filePath ? <button type="button" onClick={(event) => { event.stopPropagation(); onOpen?.(); }} aria-label="Abrir archivo"><ExternalLink size={17} /></button> : null}<button type="button" onClick={(event) => { event.stopPropagation(); onEdit(); }} aria-label="Editar"><Pencil size={17} /></button><button type="button" onClick={(event) => { event.stopPropagation(); onDelete(); }} aria-label="Borrar"><Trash2 size={17} /></button></div> : <button aria-label="Mas opciones"><MoreHorizontal size={20} /></button>}</article>;
}

function BarChart({ bars, tall = false }) {
  return <div className={`bar-chart ${tall ? 'tall' : ''}`}>{bars.map((height, index) => <span key={week[index]} style={{ '--h': `${height}%` }}>{week[index]}</span>)}</div>;
}

function TimerRing({ seconds, large }) {
  const progress = Math.max(8, 100 - Math.round((seconds / 1500) * 100));
  return <div className={`timer-ring ${large ? 'large' : ''}`} style={{ '--progress': progress }}><span>{formatTime(seconds)}</span><small>Tiempo de estudio</small></div>;
}

function PlanPanel({ plan, changeView, compact = false }) {
  if (!plan) return <section className="panel plan-panel"><h2>Plan de Hoy</h2><p>Agrega un examen para generar una guia diaria.</p><button className="primary-button" onClick={() => changeView('calendar')}><Plus size={18} />Crear examen</button></section>;
  return <section className={`panel plan-panel ${compact ? 'compact' : ''}`}>
    <div className="panel-heading"><h2>Plan de Hoy</h2><span className="status-pill">{plan.intensity}</span></div>
    <div className="plan-hero"><div><span>Objetivo principal</span><strong>{plan.topic}</strong><p>{plan.exam.subject} · {plan.exam.title}</p></div><Target size={34} /></div>
    <div className="plan-grid"><div><small>Tiempo sugerido</small><strong>{plan.dailyHours} h</strong></div><div><small>Tecnica</small><strong>{plan.technique}</strong></div><div><small>Examen</small><strong>{plan.days} dias</strong></div></div>
    <p className="study-tip">{plan.task}</p>
    {!compact ? <ul className="topic-list">{plan.pendingTopics.slice(0, 4).map((topic) => <li key={topic}><label><input type="checkbox" readOnly />{topic}</label></li>)}</ul> : null}
    <button className="secondary-button wide" onClick={() => changeView('pomodoro')}><Play size={18} />Empezar bloque</button>
  </section>;
}

function ExamFocus({ exam, toggleTopic }) {
  if (!exam) return <section className="panel focus-panel"><h2>No hay examenes cargados</h2><p>Agrega un examen para ver una recomendacion diaria.</p></section>;
  const totalTopics = Math.max(exam.topics.length, 1);
  const completedCount = exam.completedTopics.length;
  const pendingCount = Math.max(exam.topics.length - completedCount, 0);
  const progress = Math.round((completedCount / totalTopics) * 100);
  const remaining = Math.max(exam.estimatedHours - completedCount * 2, 1);
  const daily = Math.max(0.5, Math.round((remaining / Math.max(daysUntil(exam.date), 1)) * 10) / 10);
  return <section className="panel focus-panel">
    <div className="panel-heading"><h2>Examen cercano</h2><span className="status-pill">Faltan {daysUntil(exam.date)} dias</span></div>
    <strong>{exam.title}</strong><p>{exam.subject} · {formatDate(exam.date)}</p>
    <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
    <div className="progress-summary"><strong>{progress}% preparado</strong><span>{completedCount}/{exam.topics.length} temas completados</span></div>
    <div className="exam-metrics"><span>{pendingCount} pendientes</span><span>{remaining} h aprox.</span></div>
    <p className="study-tip">Recomendacion: estudia {daily} h por dia para llegar con aire.</p>
    <h3>Que estudiar hoy</h3>
    <ul className="topic-list progress-topic-list">{exam.topics.map((topic) => {
      const checked = exam.completedTopics.includes(topic);
      return <li className={checked ? 'completed' : ''} key={topic}><label><input type="checkbox" checked={checked} onChange={() => toggleTopic(exam.id, topic)} /><span>{topic}</span></label></li>;
    })}</ul>
  </section>;
}

function AssistantStrip() {
  const [sent, setSent] = useState(false);
  return <section className="panel assistant-strip"><h2><Sparkles size={20} />Asistente IA</h2><p>{sent ? 'Listo, el asistente esta preparando una respuesta.' : 'Preguntame lo que necesites sobre tus temas de estudio.'}</p><form className="ask-form" onSubmit={(event) => { event.preventDefault(); setSent(true); event.currentTarget.reset(); }}><input placeholder="Escribe tu pregunta aqui..." /><button type="submit" aria-label="Enviar"><Send size={20} /></button></form></section>;
}

function HomeView({ data, summary, timer, running, toggleTimer, changeView, toggleTopic }) {
  return <section className="view active">
    <div className="today-card"><div><span>Horas de estudio esta semana</span><strong>{summary.hours} h</strong><button onClick={() => changeView('stats')}>Ver estadisticas <ChevronRight size={15} /></button></div><Clock3 size={34} /></div>
    <div className="metrics-grid"><Metric icon={Clock3} tone="purple" label="Horas de estudio" value={`${summary.hours} h`} detail="guardadas en este dispositivo" /><Metric icon={Target} tone="green" label="Sesiones completadas" value={summary.sessions} detail="registros de estudio" /><Metric icon={Flame} tone="orange" label="Racha actual" value={`${summary.streak} dias`} detail="sigue asi" /><Metric icon={FolderOpen} tone="blue" label="Apuntes guardados" value={data.notes.length} detail="documentos" /></div>
    <div className="dashboard-grid"><section className="panel notes-panel"><div className="panel-heading"><h2>Mis Apuntes Recientes</h2><button className="link-button" onClick={() => changeView('notes')}>Ver todos</button></div><div className="document-list compact">{data.notes.slice(0, 4).map((note) => <NoteRowV2 note={note} key={note.id} />)}</div></section><section className="panel timer-panel"><h2>Pomodoro</h2><TimerRing seconds={timer} /><button className="primary-button wide" onClick={toggleTimer}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? 'Pausar' : 'Iniciar'}</button><button className="secondary-button wide" onClick={() => changeView('pomodoro')}><TimerReset size={18} />Sesiones</button></section><section className="side-stack"><PlanPanel plan={summary.dailyPlan} changeView={changeView} compact /><ExamFocus exam={summary.nextExam} toggleTopic={toggleTopic} /></section></div>
    <AssistantStrip />
  </section>;
}

function PlanView({ summary, changeView }) {
  return <section className="view active"><div className="content-grid"><PlanPanel plan={summary.dailyPlan} changeView={changeView} /><section className="panel"><h2>Como se calcula</h2><div className="explain-list"><p><strong>Urgencia:</strong> toma el examen mas cercano con temas pendientes.</p><p><strong>Tiempo:</strong> reparte las horas restantes entre los dias disponibles.</p><p><strong>Tecnica:</strong> cambia segun cercania y cantidad de temas pendientes.</p></div><button className="secondary-button wide" onClick={() => changeView('calendar')}><CalendarDays size={18} />Ver examenes</button></section></div></section>;
}

function StatsView({ data, summary }) {
  return <section className="view active"><div className="stats-layout"><section className="panel"><select className="full-select"><option>Esta semana</option></select><h2>Horas de estudio</h2><strong className="big-number">{summary.hours} h</strong><small className="positive">datos guardados localmente</small><BarChart bars={summary.bars} tall /></section><section className="panel"><h2>Tiempo por materia</h2><div className="donut" /><ul className="subject-list">{data.subjects.map((subject) => <li key={subject.id}><span className={`dot ${subject.color}`} />{subject.name} <b>{summary.subjectHours[subject.name] || 0} h</b></li>)}</ul></section></div></section>;
}

function TechniquesView() {
  const [filter, setFilter] = useState('Todas');
  const [selectedTitle, setSelectedTitle] = useState(techniques[0].title);
  const visible = filter === 'Todas' ? techniques : techniques.filter((technique) => technique.category === filter);
  const selected = techniques.find((technique) => technique.title === selectedTitle) || visible[0] || techniques[0];
  return <section className="view active"><div className="content-grid"><div className="panel techniques-list"><div className="tabs">{techniqueFilters.map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => { setFilter(item); const next = item === 'Todas' ? techniques[0] : techniques.find((technique) => technique.category === item); if (next) setSelectedTitle(next.title); }}>{item}</button>)}</div>{visible.map(({ icon: Icon, title, body, category }) => <article className={`technique-row ${selected.title === title ? 'active' : ''}`} key={title}><span className="technique-emoji"><Icon size={32} /></span><div><strong>{title}</strong><small>{category}</small><p>{body}</p></div><button type="button" aria-label={`Abrir ${title}`} onClick={() => setSelectedTitle(title)}><ChevronRight size={20} /></button></article>)}</div><section className="panel technique-detail"><div className="panel-heading"><h2>{selected.title}</h2><span className="status-pill">{selected.category}</span></div><p>{selected.bestFor}</p><h3>Como aplicarla</h3><ol>{selected.steps.map((step) => <li key={step}>{step}</li>)}</ol><button className="secondary-button wide" type="button" onClick={() => setSelectedTitle(selected.title)}><Lightbulb size={18} />Tecnica seleccionada</button></section></div></section>;
}

export default function StudifyApp({ user, onLogout }) {
  const { data, sync, addNote, updateNote, deleteNote, addSubject, updateSubject, deleteSubject, addExam, updateExam, deleteExam, addSession, updateSession, deleteSession, toggleTopic } = useStudyData(user);
  const [active, setActive] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [timer, setTimer] = useState(1500);
  const [running, setRunning] = useState(false);
  const [theme, setTheme] = useState(readTheme);
  const darkMode = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('studify-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => {
      setTimer((value) => {
        if (value <= 1) {
          setRunning(false);
          addSession({ subject: data.subjects[0]?.name || 'General', minutes: 25 });
          return 1500;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running, addSession, data.subjects]);

  const summary = useMemo(() => {
    const totalMinutes = data.sessions.reduce((total, item) => total + item.minutes, 0);
    const subjectHours = data.sessions.reduce((map, item) => ({ ...map, [item.subject]: Math.round(((map[item.subject] || 0) + item.minutes / 60) * 10) / 10 }), {});
    const totals = [0, 0, 0, 0, 0, 0, 0];
    data.sessions.forEach((session) => {
      const day = new Date(`${session.date}T00:00:00`).getDay();
      totals[day === 0 ? 6 : day - 1] += session.minutes / 60;
    });
    const max = Math.max(...totals, 1);
    const nextExam = [...data.exams].sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    return {
      hours: Math.round((totalMinutes / 60) * 10) / 10,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      sessions: data.sessions.length,
      streak: Math.min(7, new Set(data.sessions.map((item) => item.date)).size),
      subjectHours,
      bars: totals.map((value) => Math.max(6, Math.round((value / max) * 92))),
      nextExam,
      dailyPlan: buildDailyPlan(data)
    };
  }, [data]);

  const changeView = (view) => { setActive(view); setMenuOpen(false); };
  const resetTimer = () => { setRunning(false); setTimer(1500); };

  if (sync.provider === 'supabase' && sync.status === 'loading') {
    return <main className="auth-page auth-loading-page">
      <section className="auth-loading-card">
        <div className="auth-loading-logo"><GraduationCap size={34} /><span><LoaderCircle size={22} /></span></div>
        <div>
          <h2>Cargando Studify</h2>
          <p>Sincronizando tus apuntes y progreso.</p>
        </div>
        <div className="auth-loading-steps" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="auth-loading-foot"><Sparkles size={18} />Conectando con Supabase</div>
      </section>
    </main>;
  }

  return <div className={`app-shell ${darkMode ? 'theme-dark' : ''}`}><Sidebar active={active} open={menuOpen} changeView={changeView} close={() => setMenuOpen(false)} user={user} /><main className="main-content"><Header active={active} openMenu={() => setMenuOpen(true)} changeView={changeView} sync={sync} user={user} darkMode={darkMode} toggleTheme={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} />{active === 'home' && <HomeView data={data} summary={summary} timer={timer} running={running} toggleTimer={() => setRunning((value) => !value)} changeView={changeView} toggleTopic={toggleTopic} />}{active === 'plan' && <PlanView summary={summary} changeView={changeView} />}{active === 'notes' && <NotesView data={data} addNote={addNote} updateNote={updateNote} deleteNote={deleteNote} />}{active === 'pomodoro' && <PomodoroView data={data} timer={timer} running={running} toggleTimer={() => setRunning((value) => !value)} resetTimer={resetTimer} addSession={addSession} updateSession={updateSession} deleteSession={deleteSession} />}{active === 'stats' && <StatsView data={data} summary={summary} />}{active === 'assistant' && <AssistantView data={data} addSession={addSession} changeView={changeView} />}{active === 'calendar' && <CalendarView data={data} addExam={addExam} updateExam={updateExam} deleteExam={deleteExam} toggleTopic={toggleTopic} />}{active === 'techniques' && <TechniquesView />}{active === 'profile' && <ProfileView data={data} addSubject={addSubject} updateSubject={updateSubject} deleteSubject={deleteSubject} summary={summary} user={user} onLogout={onLogout} sync={sync} />}</main><nav className="bottom-nav">{nav.filter(([key]) => ['home', 'notes', 'assistant', 'stats', 'profile'].includes(key)).map(([key, label, Icon]) => <button className={`nav-item ${active === key ? 'active' : ''}`} key={key} onClick={() => changeView(key)}><Icon size={20} /><span>{label.replace('Mis ', '').replace('IA ', 'IA')}</span></button>)}</nav></div>;
}

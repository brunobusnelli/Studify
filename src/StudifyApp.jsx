import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3, Bell, BookOpen, Brain, CalendarDays, ChevronDown, ChevronRight, Clock3,
  ExternalLink, FileText, Flame, FolderOpen, GraduationCap, Home, Lightbulb, ListChecks, Menu, Moon,
  LogOut, MoreHorizontal, Pause, Pencil, Play, Plus, RotateCcw, Search, Send, Sparkles, Target,
  TimerReset, Trash2, Trophy, Upload, User, X
} from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabaseClient.js';
import {
  createRemoteExam, createRemoteNote, createRemoteSession, createRemoteSubject,
  deleteRemoteExam, deleteRemoteNote, deleteRemoteSession, deleteRemoteSubject,
  loadRemoteStudyData, updateRemoteExam, updateRemoteNote, updateRemoteSession,
  updateRemoteSubject
} from './lib/studyDataApi.js';
import { askStudyAssistant } from './lib/studyAssistantApi.js';
import { deleteStudyFile, getStudyFileUrl, uploadStudyFile } from './lib/studyFiles.js';

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
  home: ['Hola, Usuario', 'La disciplina de hoy es el exito de manana.'],
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
  [TimerReset, 'Pomodoro', '25 minutos de enfoque y 5 minutos de descanso.'],
  [Brain, 'Tecnica Feynman', 'Explica un tema con palabras simples para descubrir dudas.'],
  [BookOpen, 'Mapas mentales', 'Conecta conceptos visualmente para recordar relaciones clave.'],
  [Target, 'Active recall', 'Practica recordar sin mirar tus apuntes.']
];

const week = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const formatTime = (value) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const formatDate = (value) => new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
const daysUntil = (value) => Math.max(0, Math.ceil((new Date(`${value}T00:00:00`) - new Date(`${today()}T00:00:00`)) / 86400000));
const topicsToText = (topics) => topics.join(', ');
const textToTopics = (value) => String(value).split(',').map((item) => item.trim()).filter(Boolean);
const cleanAssistantText = (value) => String(value)
  .replace(/```[a-zA-Z]*\s*/g, '')
  .replace(/```/g, '')
  .split('\n')
  .map((line) => line.trimEnd())
  .filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (/^-{3,}$/.test(trimmed)) return false;
    if (/^\);$/.test(trimmed)) return false;
    return true;
  })
  .join('\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

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

function Header({ active, openMenu, changeView, sync }) {
  const [title, subtitle] = pages[active];
  return <header className="topbar">
    <IconButton label="Abrir menu" onClick={openMenu}><Menu size={22} /></IconButton>
    <div className="title-block"><h1>{title}{active === 'home' ? '!' : ''}</h1><p>{subtitle}</p></div>
    <div className="top-actions"><span className={`sync-pill ${sync?.status || 'local'}`}>{sync?.provider === 'supabase' ? 'Supabase' : 'Local'}</span><IconButton label="Notificaciones"><Bell size={20} /></IconButton><IconButton label="Modo oscuro"><Moon size={20} /></IconButton><button className="primary-button" onClick={() => changeView('notes')}><Plus size={18} />Nuevo Apunte</button></div>
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

function NoteRowV2({ note, onEdit, onDelete, onOpen }) {
  const storageLabel = note.storage === 'supabase' ? 'Supabase' : note.fileName ? 'archivo local' : 'manual';
  return <article className="document-row editable-row"><span className={`file-icon ${note.type === 'DOC' ? 'doc' : ''}`}>{note.type}</span><div><strong>{note.title}</strong><small>{note.subject} - {formatDate(note.date)} - {note.size} - {storageLabel}</small>{note.fileName ? <em>{note.fileName}</em> : null}</div>{onEdit ? <div className="row-actions">{note.filePath ? <button type="button" onClick={onOpen} aria-label="Abrir archivo"><ExternalLink size={17} /></button> : null}<button type="button" onClick={onEdit} aria-label="Editar"><Pencil size={17} /></button><button type="button" onClick={onDelete} aria-label="Borrar"><Trash2 size={17} /></button></div> : <button aria-label="Mas opciones"><MoreHorizontal size={20} /></button>}</article>;
}

function BarChart({ bars, tall = false }) {
  return <div className={`bar-chart ${tall ? 'tall' : ''}`}>{bars.map((height, index) => <span key={week[index]} style={{ '--h': `${height}%` }}>{week[index]}</span>)}</div>;
}

function TimerRing({ seconds, large }) {
  const progress = Math.max(8, 100 - Math.round((seconds / 1500) * 100));
  return <div className={`timer-ring ${large ? 'large' : ''}`} style={{ '--progress': progress }}><span>{formatTime(seconds)}</span><small>Tiempo de estudio</small></div>;
}

function QuickForm({ title, children, onSubmit, editing, onCancel, submitting = false, submitLabel }) {
  return <form className="quick-form" onSubmit={onSubmit}><div className="form-heading"><h3>{title}</h3>{editing ? <button type="button" className="link-button" onClick={onCancel}>Cancelar</button> : null}</div>{children}<button className="primary-button" type="submit" disabled={submitting}>{submitting ? <Upload size={17} /> : editing ? <Pencil size={17} /> : <Plus size={17} />}{submitting ? submitLabel || 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar'}</button></form>;
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
  const progress = Math.round((exam.completedTopics.length / Math.max(exam.topics.length, 1)) * 100);
  const remaining = Math.max(exam.estimatedHours - exam.completedTopics.length * 2, 1);
  const daily = Math.max(0.5, Math.round((remaining / Math.max(daysUntil(exam.date), 1)) * 10) / 10);
  return <section className="panel focus-panel">
    <div className="panel-heading"><h2>Examen cercano</h2><span className="status-pill">Faltan {daysUntil(exam.date)} dias</span></div>
    <strong>{exam.title}</strong><p>{exam.subject} · {formatDate(exam.date)}</p>
    <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
    <small>{progress}% preparado · quedan aprox. {remaining} h</small>
    <p className="study-tip">Recomendacion: estudia {daily} h por dia para llegar con aire.</p>
    <h3>Que estudiar hoy</h3>
    <ul className="topic-list">{exam.topics.map((topic) => <li key={topic}><label><input type="checkbox" checked={exam.completedTopics.includes(topic)} onChange={() => toggleTopic(exam.id, topic)} />{topic}</label></li>)}</ul>
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

function NotesView({ data, addNote, updateNote, deleteNote }) {
  const [filter, setFilter] = useState('Todos');
  const [editing, setEditing] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const submitLock = useRef(false);
  const visible = filter === 'Todos' ? data.notes : data.notes.filter((note) => note.subject === filter);
  const submitNote = async (event) => {
    event.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    const formElement = event.currentTarget;
    setUploadStatus('');
    setIsUploading(true);
    const form = new FormData(formElement);
    const file = form.get('file');
    const selectedFile = file instanceof File && file.size > 0 ? file : null;

    try {
      const uploaded = selectedFile ? await uploadStudyFile(selectedFile) : null;
      const payload = {
        title: form.get('title') || uploaded?.fileName || 'Nuevo apunte',
        subject: form.get('subject'),
        type: uploaded?.fileType || form.get('type'),
        size: uploaded?.fileSize || editing?.size || 'Manual',
        fileName: uploaded?.fileName || editing?.fileName || null,
        filePath: uploaded?.filePath || editing?.filePath || null,
        storage: uploaded?.storage || editing?.storage || 'manual'
      };

      if (editing) {
        updateNote(editing.id, payload);
        setEditing(null);
        setUploadStatus(selectedFile ? 'Apunte actualizado y archivo cargado.' : 'Apunte actualizado.');
      } else {
        addNote(payload);
        setUploadStatus(uploaded?.storage === 'supabase' ? 'Archivo subido a Supabase.' : selectedFile ? 'Archivo guardado como metadata local.' : 'Apunte creado.');
      }
      formElement.reset();
    } catch (error) {
      setUploadStatus(error.message || 'No se pudo subir el archivo.');
    } finally {
      submitLock.current = false;
      setIsUploading(false);
    }
  };
  const openNote = async (note) => {
    const tab = window.open('', '_blank', 'noopener,noreferrer');
    try {
      setUploadStatus('');
      const url = await getStudyFileUrl(note.filePath);
      if (!url) {
        tab?.close();
        setUploadStatus('Este apunte no tiene un archivo subido para abrir.');
        return;
      }
      if (tab) {
        tab.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (error) {
      tab?.close();
      setUploadStatus(error.message || 'No se pudo abrir el archivo.');
    }
  };
  return <section className="view active"><div className="content-grid"><div><div className="section-toolbar"><div className="tabs"><button className={filter === 'Todos' ? 'active' : ''} onClick={() => setFilter('Todos')}>Todos</button>{data.subjects.map((subject) => <button className={filter === subject.name ? 'active' : ''} key={subject.id} onClick={() => setFilter(subject.name)}>{subject.name}</button>)}</div><div className="toolbar-actions"><button className="icon-button" aria-label="Buscar"><Search size={20} /></button><button className="primary-button" type="button" disabled={isUploading} onClick={() => document.getElementById('study-file-input')?.click()}><Upload size={18} />Subir apunte</button></div></div><div className="panel document-list">{visible.map((note) => <NoteRowV2 note={note} key={note.id} onOpen={() => openNote(note)} onEdit={() => setEditing(note)} onDelete={() => window.confirm('Borrar este apunte?') && deleteNote(note.id)} />)}</div></div><div className="panel"><QuickForm title={editing ? 'Editar apunte' : 'Nuevo apunte'} editing={Boolean(editing)} onCancel={() => { setEditing(null); setUploadStatus(''); }} onSubmit={submitNote} submitting={isUploading} submitLabel="Subiendo..."><input name="title" placeholder="Titulo del apunte" defaultValue={editing?.title || ''} key={`title-${editing?.id || 'new'}`} /><select name="subject" defaultValue={editing?.subject || data.subjects[0]?.name} key={`subject-${editing?.id || 'new'}`}>{data.subjects.map((subject) => <option key={subject.id}>{subject.name}</option>)}</select><select name="type" defaultValue={editing?.type || 'PDF'} key={`type-${editing?.id || 'new'}`}><option>PDF</option><option>DOC</option><option>LINK</option></select><label className="file-upload-box" htmlFor="study-file-input"><Upload size={19} /><span>Seleccionar PDF, DOC o DOCX</span><small>{editing?.fileName || 'Si Supabase esta activo, se sube al bucket study-files.'}</small></label><input id="study-file-input" className="file-input" name="file" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={isUploading} />{uploadStatus ? <p className="upload-status">{uploadStatus}</p> : null}</QuickForm></div></div></section>;
}

function PomodoroView({ data, timer, running, toggleTimer, resetTimer, addSession, updateSession, deleteSession }) {
  const [subject, setSubject] = useState(data.subjects[0]?.name || 'General');
  const [editing, setEditing] = useState(null);
  const submitSession = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { subject: form.get('subject'), minutes: Number(form.get('minutes') || 25), date: form.get('date') || today() };
    if (editing) {
      updateSession(editing.id, payload);
      setEditing(null);
    } else {
      addSession(payload);
    }
    event.currentTarget.reset();
  };
  return <section className="view active"><div className="content-grid"><div className="mobile-screen panel centered-screen"><div className="tabs full"><button className="active">Estudio</button><button>Descanso</button></div><TimerRing seconds={timer} large /><select className="full-select" value={subject} onChange={(event) => setSubject(event.target.value)}>{data.subjects.map((item) => <option key={item.id}>{item.name}</option>)}</select><button className="primary-button wide" onClick={toggleTimer}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? 'Pausar' : 'Iniciar'}</button><button className="secondary-button wide" onClick={resetTimer}><RotateCcw size={18} />Reiniciar</button><button className="secondary-button wide" onClick={() => addSession({ subject, minutes: 25 })}><Plus size={18} />Registrar sesion de 25 min</button><div className="session-summary"><div><strong>{data.sessions.length}</strong><span>Completadas</span></div><div><strong>{Math.round(data.sessions.reduce((total, item) => total + item.minutes, 0) / 60)} h</strong><span>Tiempo total</span></div></div></div><div className="panel session-panel"><QuickForm title={editing ? 'Editar sesion' : 'Registrar sesion manual'} editing={Boolean(editing)} onCancel={() => setEditing(null)} onSubmit={submitSession}><select name="subject" defaultValue={editing?.subject || subject} key={`session-subject-${editing?.id || 'new'}`}>{data.subjects.map((item) => <option key={item.id}>{item.name}</option>)}</select><input name="minutes" min="1" type="number" placeholder="Minutos" defaultValue={editing?.minutes || 25} key={`session-minutes-${editing?.id || 'new'}`} /><input name="date" type="date" defaultValue={editing?.date || today()} key={`session-date-${editing?.id || 'new'}`} /></QuickForm><div className="session-list"><h3>Historial</h3>{data.sessions.map((session) => <article className="session-card" key={session.id}><div><strong>{session.subject}</strong><small>{session.minutes} min · {formatDate(session.date)}</small></div><RowActions onEdit={() => setEditing(session)} onDelete={() => window.confirm('Borrar esta sesion?') && deleteSession(session.id)} /></article>)}</div></div></div></section>;
}

function StatsView({ data, summary }) {
  return <section className="view active"><div className="stats-layout"><section className="panel"><select className="full-select"><option>Esta semana</option></select><h2>Horas de estudio</h2><strong className="big-number">{summary.hours} h</strong><small className="positive">datos guardados localmente</small><BarChart bars={summary.bars} tall /></section><section className="panel"><h2>Tiempo por materia</h2><div className="donut" /><ul className="subject-list">{data.subjects.map((subject) => <li key={subject.id}><span className={`dot ${subject.color}`} />{subject.name} <b>{summary.subjectHours[subject.name] || 0} h</b></li>)}</ul></section></div></section>;
}

function AssistantView({ data }) {
  const notesWithFiles = data.notes.filter((note) => note.filePath || note.fileName);
  const [selectedNoteId, setSelectedNoteId] = useState(notesWithFiles[0]?.id || data.notes[0]?.id || '');
  const [mode, setMode] = useState('summary');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [assistantStatus, setAssistantStatus] = useState({ state: 'idle', message: '' });
  useEffect(() => {
    if (!data.notes.length) {
      setSelectedNoteId('');
      return;
    }
    if (!selectedNoteId || !data.notes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(data.notes[0].id);
    }
  }, [data.notes, selectedNoteId]);
  const selectedNote = data.notes.find((note) => note.id === selectedNoteId) || data.notes[0];
  useEffect(() => {
    setAnswer('');
    setAssistantStatus({ state: 'idle', message: '' });
  }, [selectedNoteId, mode]);
  const modeLabels = {
    summary: 'Resumen',
    explain: 'Explicacion',
    questions: 'Preguntas'
  };
  const suggestions = {
    summary: [
      `Idea central: ${selectedNote?.title || 'el apunte elegido'} pertenece a ${selectedNote?.subject || 'una materia'} y conviene repasarlo por bloques.`,
      'Marcaria conceptos principales, definiciones y ejemplos antes de pasar a practica.',
      'Para el siguiente paso, conviene extraer texto real del archivo y generar un resumen fiel.'
    ],
    explain: [
      `Explicacion guia: toma ${selectedNote?.title || 'este tema'} como si tuvieras que contarlo con palabras simples.`,
      'Primero identifica el concepto, despues un ejemplo y al final una duda que todavia tengas.',
      question ? `Pregunta a responder: ${question}` : 'Podemos usar tu pregunta para orientar la explicacion.'
    ],
    questions: [
      `1. Que conceptos principales aparecen en ${selectedNote?.title || 'este apunte'}?`,
      '2. Como explicarias el tema sin mirar el material?',
      '3. Que parte necesitarias repasar antes de un examen?'
    ]
  };
  const actionButtons = [
    ['summary', FileText, 'Resumir apunte', 'Arma un borrador ordenado para repasar.'],
    ['explain', Brain, 'Explicarme un tema', 'Convierte el material en una explicacion simple.'],
    ['questions', BookOpen, 'Crear preguntas', 'Prepara practica para active recall.']
  ];
  const submitAssistant = async (event) => {
    event.preventDefault();
    setAssistantStatus({ state: 'loading', message: 'Consultando Gemini...' });
    setAnswer('');
    try {
      const result = await askStudyAssistant({ noteId: selectedNoteId, mode, question });
      setAnswer(cleanAssistantText(result.answer || 'Gemini respondio sin texto.'));
      setAssistantStatus({ state: 'ready', message: 'Respuesta generada con Gemini.' });
    } catch (error) {
      setAssistantStatus({ state: 'error', message: error.message || 'No se pudo consultar Gemini.' });
    }
  };
  const outputText = answer || suggestions[mode].join('\n\n');
  const statusLabel = assistantStatus.state === 'loading' ? 'Gemini' : assistantStatus.state === 'ready' ? 'Listo' : assistantStatus.state === 'error' ? 'Error' : 'Borrador';
  return <section className="view active"><div className="assistant-workspace"><div className="panel ai-panel"><div className="sparkle"><Sparkles size={36} /></div><h2>IA Asistente</h2><p className="muted">Elegi un apunte y una accion para preparar tu estudio.</p><div className="ai-actions">{actionButtons.map(([key, Icon, title, body]) => <button type="button" className={mode === key ? 'active' : ''} key={key} onClick={() => setMode(key)}><div><strong>{title}</strong><span>{body}</span></div><Icon size={22} /></button>)}</div></div><div className="panel assistant-panel"><div className="panel-heading"><h2>{modeLabels[mode]}</h2><span className={`status-pill ${assistantStatus.state}`}>{statusLabel}</span></div>{data.notes.length ? <><label className="note-picker"><span>Apunte</span><select value={selectedNoteId} onChange={(event) => setSelectedNoteId(event.target.value)}>{data.notes.map((note) => <option key={note.id} value={note.id}>{note.title}</option>)}</select></label><form className="assistant-composer" onSubmit={submitAssistant}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Escribe una duda o tema puntual..." /><button type="submit" aria-label="Enviar" disabled={assistantStatus.state === 'loading'}><Send size={20} /></button></form>{assistantStatus.message ? <p className={`save-status ${assistantStatus.state}`}>{assistantStatus.message}</p> : null}<div className="assistant-output"><strong>{selectedNote?.title}</strong><small>{selectedNote?.subject} - {selectedNote?.type} - {selectedNote?.size}</small><div className="assistant-answer">{outputText}</div></div></> : <p className="empty-state">Subi un apunte para empezar a trabajar con el asistente.</p>}</div></div></section>;
}

function CalendarView({ data, addExam, updateExam, deleteExam, toggleTopic }) {
  const [editing, setEditing] = useState(null);
  const nextExam = [...data.exams].sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const submitExam = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { title: form.get('title'), subject: form.get('subject'), date: form.get('date'), estimatedHours: Number(form.get('estimatedHours') || 5), topics: textToTopics(form.get('topics')) };
    if (editing) {
      updateExam(editing.id, payload);
      setEditing(null);
    } else {
      addExam(payload);
    }
    event.currentTarget.reset();
  };
  return <section className="view active"><div className="content-grid"><div><ExamFocus exam={nextExam} toggleTopic={toggleTopic} /><div className="panel exam-list"><h2>Todos los examenes</h2>{data.exams.map((exam) => <article className="exam-card" key={exam.id}><div><strong>{exam.title}</strong><small>{exam.subject} · {formatDate(exam.date)} · faltan {daysUntil(exam.date)} dias</small></div><span>{Math.round((exam.completedTopics.length / Math.max(exam.topics.length, 1)) * 100)}%</span><RowActions onEdit={() => setEditing(exam)} onDelete={() => window.confirm('Borrar este examen?') && deleteExam(exam.id)} /></article>)}</div></div><div className="panel"><QuickForm title={editing ? 'Editar examen' : 'Nuevo examen'} editing={Boolean(editing)} onCancel={() => setEditing(null)} onSubmit={submitExam}><input name="title" required placeholder="Nombre del examen" defaultValue={editing?.title || ''} key={`exam-title-${editing?.id || 'new'}`} /><select name="subject" defaultValue={editing?.subject || data.subjects[0]?.name} key={`exam-subject-${editing?.id || 'new'}`}>{data.subjects.map((subject) => <option key={subject.id}>{subject.name}</option>)}</select><input name="date" required type="date" defaultValue={editing?.date || ''} key={`exam-date-${editing?.id || 'new'}`} /><input name="estimatedHours" min="1" type="number" placeholder="Horas estimadas" defaultValue={editing?.estimatedHours || ''} key={`exam-hours-${editing?.id || 'new'}`} /><textarea name="topics" required placeholder="Temas separados por coma" defaultValue={editing ? topicsToText(editing.topics) : ''} key={`exam-topics-${editing?.id || 'new'}`} /></QuickForm></div></div></section>;
}

function TechniquesView() {
  return <section className="view active"><div className="panel techniques-list"><div className="tabs"><button className="active">Todas</button><button>Productividad</button><button>Memorizacion</button><button>Comprension</button></div>{techniques.map(([Icon, title, body]) => <article className="technique-row" key={title}><span className="technique-emoji"><Icon size={32} /></span><div><strong>{title}</strong><p>{body}</p></div><button aria-label="Abrir tecnica"><ChevronRight size={20} /></button></article>)}</div></section>;
}

function ProfileView({ data, addSubject, updateSubject, deleteSubject, summary, user, onLogout, sync }) {
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState('');
  const submitSubject = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get('name'), targetHours: Number(form.get('targetHours') || 5), color: form.get('color') };
    if (editing) {
      updateSubject(editing.id, payload);
      setEditing(null);
      setStatus('Materia actualizada. Se esta sincronizando con Supabase.');
    } else {
      addSubject(payload);
      setStatus('Materia creada. Se esta sincronizando con Supabase.');
    }
    event.currentTarget.reset();
  };
  return <section className="view active"><div className="content-grid"><div className="panel profile-panel"><div className="profile-head"><div className="avatar large"><User size={42} /></div><div><h2>Usuario</h2><p>estudiante@mail.com</p><button className="primary-button small">Editar perfil</button></div></div><div className="profile-stats"><p><Flame size={20} />Racha actual <b>{summary.streak} dias</b></p><p><Clock3 size={20} />Horas totales <b>{summary.totalHours} h</b></p><p><Target size={20} />Sesiones completadas <b>{data.sessions.length}</b></p><p><FolderOpen size={20} />Apuntes guardados <b>{data.notes.length}</b></p><p><BarChart3 size={20} />Materias <b>{data.subjects.length}</b></p><p><Trophy size={20} />Examenes <b>{data.exams.length}</b></p></div><div className="subject-list-panel"><h3>Materias</h3>{data.subjects.map((subject) => <article className="subject-card" key={subject.id}><span className={`dot ${subject.color}`} /><div><strong>{subject.name}</strong><small>{summary.subjectHours[subject.name] || 0} h estudiadas · objetivo {subject.targetHours} h</small></div><RowActions onEdit={() => setEditing(subject)} onDelete={() => window.confirm('Borrar esta materia? Los apuntes y sesiones anteriores conservan su nombre historico.') && deleteSubject(subject.id)} /></article>)}</div></div><div className="panel"><QuickForm title={editing ? 'Editar materia' : 'Nueva materia'} editing={Boolean(editing)} onCancel={() => setEditing(null)} onSubmit={submitSubject}><input name="name" required placeholder="Nombre de la materia" defaultValue={editing?.name || ''} key={`subject-name-${editing?.id || 'new'}`} /><input name="targetHours" min="1" type="number" placeholder="Horas objetivo" defaultValue={editing?.targetHours || ''} key={`subject-hours-${editing?.id || 'new'}`} /><select name="color" defaultValue={editing?.color || 'purple'} key={`subject-color-${editing?.id || 'new'}`}><option value="purple">Violeta</option><option value="green">Verde</option><option value="orange">Naranja</option><option value="blue">Azul</option></select></QuickForm></div></div></section>;
}

function ProfileViewV2({ data, addSubject, updateSubject, deleteSubject, summary, user, onLogout, sync }) {
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState('');
  const submitSubject = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get('name'), targetHours: Number(form.get('targetHours') || 5), color: form.get('color') };
    if (editing) {
      updateSubject(editing.id, payload);
      setEditing(null);
      setStatus('Materia actualizada. Se esta sincronizando con Supabase.');
    } else {
      addSubject(payload);
      setStatus('Materia creada. Se esta sincronizando con Supabase.');
    }
    event.currentTarget.reset();
  };
  return <section className="view active"><div className="content-grid"><div className="panel profile-panel"><div className="profile-head"><div className="avatar large"><User size={42} /></div><div><h2>{user?.name || 'Usuario'}</h2><p>{user?.email || 'estudiante@mail.com'}</p><span className={`sync-pill ${sync?.status || 'local'}`}>{sync?.provider === 'supabase' ? 'Cuenta Supabase' : 'Demo local'}</span></div>{onLogout ? <button className="secondary-button compact" type="button" onClick={onLogout}><LogOut size={18} />Salir</button> : null}</div><div className="profile-stats"><p><Flame size={20} />Racha actual <b>{summary.streak} dias</b></p><p><Clock3 size={20} />Horas totales <b>{summary.totalHours} h</b></p><p><Target size={20} />Sesiones completadas <b>{data.sessions.length}</b></p><p><FolderOpen size={20} />Apuntes guardados <b>{data.notes.length}</b></p><p><BarChart3 size={20} />Materias <b>{data.subjects.length}</b></p><p><Trophy size={20} />Examenes <b>{data.exams.length}</b></p></div><div className="subject-list-panel"><h3>Materias</h3>{data.subjects.length ? data.subjects.map((subject) => <article className="subject-card" key={subject.id}><span className={`dot ${subject.color}`} /><div><strong>{subject.name}</strong><small>{summary.subjectHours[subject.name] || 0} h estudiadas - objetivo {subject.targetHours} h</small></div><RowActions onEdit={() => { setEditing(subject); setStatus(''); }} onDelete={() => window.confirm('Borrar esta materia? Los apuntes y sesiones anteriores conservan su nombre historico.') && deleteSubject(subject.id)} /></article>) : <p className="empty-state">Todavia no cargaste materias.</p>}</div></div><div className="panel"><QuickForm title={editing ? 'Editar materia' : 'Nueva materia'} editing={Boolean(editing)} onCancel={() => { setEditing(null); setStatus(''); }} onSubmit={submitSubject}><input name="name" required placeholder="Nombre de la materia" defaultValue={editing?.name || ''} key={`subject-name-${editing?.id || 'new'}`} /><input name="targetHours" min="1" type="number" placeholder="Horas objetivo" defaultValue={editing?.targetHours || ''} key={`subject-hours-${editing?.id || 'new'}`} /><select name="color" defaultValue={editing?.color || 'purple'} key={`subject-color-${editing?.id || 'new'}`}><option value="purple">Violeta</option><option value="green">Verde</option><option value="orange">Naranja</option><option value="blue">Azul</option></select>{status ? <p className="upload-status">{status}</p> : null}{sync?.message ? <p className={`save-status ${sync.status || 'local'}`}>{sync.message}</p> : null}</QuickForm></div></div></section>;
}

export default function StudifyApp({ user, onLogout }) {
  const { data, sync, addNote, updateNote, deleteNote, addSubject, updateSubject, deleteSubject, addExam, updateExam, deleteExam, addSession, updateSession, deleteSession, toggleTopic } = useStudyData(user);
  const [active, setActive] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [timer, setTimer] = useState(1500);
  const [running, setRunning] = useState(false);

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
    return <main className="auth-page">
      <section className="auth-card">
        <div>
          <h2>Cargando Studify</h2>
          <p>Sincronizando tus datos con Supabase.</p>
        </div>
      </section>
    </main>;
  }

  return <div className="app-shell"><Sidebar active={active} open={menuOpen} changeView={changeView} close={() => setMenuOpen(false)} user={user} /><main className="main-content"><Header active={active} openMenu={() => setMenuOpen(true)} changeView={changeView} sync={sync} />{active === 'home' && <HomeView data={data} summary={summary} timer={timer} running={running} toggleTimer={() => setRunning((value) => !value)} changeView={changeView} toggleTopic={toggleTopic} />}{active === 'plan' && <PlanView summary={summary} changeView={changeView} />}{active === 'notes' && <NotesView data={data} addNote={addNote} updateNote={updateNote} deleteNote={deleteNote} />}{active === 'pomodoro' && <PomodoroView data={data} timer={timer} running={running} toggleTimer={() => setRunning((value) => !value)} resetTimer={resetTimer} addSession={addSession} updateSession={updateSession} deleteSession={deleteSession} />}{active === 'stats' && <StatsView data={data} summary={summary} />}{active === 'assistant' && <AssistantView data={data} />}{active === 'calendar' && <CalendarView data={data} addExam={addExam} updateExam={updateExam} deleteExam={deleteExam} toggleTopic={toggleTopic} />}{active === 'techniques' && <TechniquesView />}{active === 'profile' && <ProfileViewV2 data={data} addSubject={addSubject} updateSubject={updateSubject} deleteSubject={deleteSubject} summary={summary} user={user} onLogout={onLogout} sync={sync} />}</main><nav className="bottom-nav">{nav.filter(([key]) => ['home', 'notes', 'plan', 'stats', 'profile'].includes(key)).map(([key, label, Icon]) => <button className={`nav-item ${active === key ? 'active' : ''}`} key={key} onClick={() => changeView(key)}><Icon size={20} /><span>{label.replace('Mis ', '')}</span></button>)}</nav></div>;
}

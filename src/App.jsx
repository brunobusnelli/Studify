import { useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Flame,
  FolderOpen,
  GraduationCap,
  Home,
  Lightbulb,
  Menu,
  Moon,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  Sparkles,
  Target,
  TimerReset,
  Trophy,
  Upload,
  User,
  X
} from 'lucide-react';

const notes = [
  { title: 'Fisiologia Humana - Unidad 2', subject: 'Biologia', date: '21/05/2024', size: '2.4 MB', type: 'PDF' },
  { title: 'Calculo Integral - Resumen', subject: 'Matematica', date: '19/05/2024', size: '1.8 MB', type: 'PDF' },
  { title: 'Historia Argentina - Siglo XIX', subject: 'Historia', date: '18/05/2024', size: '3.1 MB', type: 'PDF' },
  { title: 'Quimica Organica - Compuestos', subject: 'Quimica', date: '17/05/2024', size: '2.7 MB', type: 'PDF' },
  { title: 'Teoria Celular - Apuntes', subject: 'Biologia', date: '15/05/2024', size: '1.2 MB', type: 'DOC' },
  { title: 'Fisica - Leyes de Newton', subject: 'Fisica', date: '14/05/2024', size: '2.0 MB', type: 'PDF' },
  { title: 'Literatura - Modernismo', subject: 'Literatura', date: '12/05/2024', size: '1.6 MB', type: 'PDF' }
];

const techniques = [
  { icon: TimerReset, title: 'Pomodoro', body: '25 minutos de enfoque y 5 minutos de descanso para sostener la concentracion.' },
  { icon: Brain, title: 'Tecnica Feynman', body: 'Explica el tema con palabras simples para detectar lo que falta entender.' },
  { icon: BookOpen, title: 'Mapas mentales', body: 'Conecta conceptos visualmente para recordar relaciones e ideas clave.' },
  { icon: Target, title: 'Active recall', body: 'Practica recordar sin mirar los apuntes y revisa donde fallaste.' },
  { icon: CalendarDays, title: 'Repeticion espaciada', body: 'Agenda repasos separados para retener informacion por mas tiempo.' }
];

const weeklyBars = [50, 68, 92, 74, 52, 30, 6];
const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

const pageCopy = {
  home: ['Hola, Usuario', 'La disciplina de hoy es el exito de manana.'],
  notes: ['Mis Apuntes', 'Organiza, filtra y consulta tus materiales.'],
  stats: ['Estadisticas', 'Mira como avanza tu estudio esta semana.'],
  pomodoro: ['Pomodoro', 'Enfocate por bloques y registra tus sesiones.'],
  techniques: ['Tecnicas de Estudio', 'Elige el metodo adecuado para cada objetivo.'],
  assistant: ['IA Asistente', 'Resume, explica y practica con tus apuntes.'],
  calendar: ['Calendario', 'Planifica sesiones y examenes cercanos.'],
  profile: ['Perfil', 'Tu actividad y logros de estudio.']
};

const navItems = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'notes', label: 'Mis Apuntes', icon: FileText },
  { id: 'stats', label: 'Estadisticas', icon: BarChart3 },
  { id: 'pomodoro', label: 'Pomodoro', icon: Clock3 },
  { id: 'techniques', label: 'Tecnicas', icon: Lightbulb },
  { id: 'assistant', label: 'IA Asistente', icon: Sparkles },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'profile', label: 'Perfil', icon: User }
];

function formatTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const rest = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
}

function IconButton({ label, children, onClick }) {
  return <button className="icon-button" aria-label={label} title={label} onClick={onClick}>{children}</button>;
}

function Sidebar({ activeView, onChangeView, open, onClose }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Navegacion principal">
      <div className="sidebar-top">
        <div className="brand">
          <span className="brand-mark"><GraduationCap size={28} /></span>
          <div>
            <strong>Studify</strong>
            <span>Tu estudio, mejor organizado.</span>
          </div>
        </div>
        <IconButton label="Cerrar menu" onClick={onClose}><X size={18} /></IconButton>
      </div>

      <nav className="side-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button className={`nav-item ${activeView === id ? 'active' : ''}`} key={id} onClick={() => onChangeView(id)}>
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="profile-mini">
        <div className="avatar"><User size={24} /></div>
        <div>
          <strong>Usuario</strong>
          <span>estudiante@mail.com</span>
        </div>
        <ChevronDown size={18} />
      </div>
    </aside>
  );
}

function Header({ activeView, onMenu, onChangeView }) {
  const [title, subtitle] = pageCopy[activeView];

  return (
    <header className="topbar">
      <IconButton label="Abrir menu" onClick={onMenu}><Menu size={22} /></IconButton>
      <div className="title-block">
        <h1>{title}{activeView === 'home' ? <span className="wave">!</span> : null}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="top-actions">
        <IconButton label="Notificaciones"><Bell size={20} /></IconButton>
        <IconButton label="Modo oscuro"><Moon size={20} /></IconButton>
        <button className="primary-button" onClick={() => onChangeView('notes')}><Plus size={18} />Nuevo Apunte</button>
      </div>
    </header>
  );
}

function MetricCard({ icon: Icon, tone, label, value, detail }) {
  return (
    <article className="metric-card">
      <span className={`metric-icon ${tone}`}><Icon size={28} /></span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function NoteRow({ note }) {
  return (
    <article className="document-row">
      <span className={`file-icon ${note.type === 'DOC' ? 'doc' : ''}`}>{note.type}</span>
      <div>
        <strong>{note.title}</strong>
        <small>{note.subject} · {note.date} · {note.size}</small>
      </div>
      <button aria-label="Mas opciones"><MoreHorizontal size={20} /></button>
    </article>
  );
}

function BarChart({ tall = false }) {
  return (
    <div className={`bar-chart ${tall ? 'tall' : ''}`} aria-label="Horas de estudio por dia">
      {weeklyBars.map((height, index) => <span key={weekDays[index]} style={{ '--h': `${height}%` }}>{weekDays[index]}</span>)}
    </div>
  );
}

function TimerRing({ seconds, large = false }) {
  const progress = 100 - Math.round((seconds / 1500) * 100);
  return (
    <div className={`timer-ring ${large ? 'large' : ''}`} style={{ '--progress': Math.max(8, progress) }}>
      <span>{formatTime(seconds)}</span>
      <small>Tiempo de estudio</small>
    </div>
  );
}

function HomeView({ seconds, running, onToggleTimer, onChangeView }) {
  return (
    <section className="view active">
      <div className="today-card">
        <div>
          <span>Horas de estudio hoy</span>
          <strong>2h 45m</strong>
          <button onClick={() => onChangeView('stats')}>Ver estadisticas <ChevronRight size={15} /></button>
        </div>
        <Clock3 size={34} />
      </div>

      <div className="metrics-grid">
        <MetricCard icon={Clock3} tone="purple" label="Horas de estudio" value="18.5 h" detail="12% mas que la semana pasada" />
        <MetricCard icon={Target} tone="green" label="Sesiones completadas" value="14" detail="8% mas que la semana pasada" />
        <MetricCard icon={Flame} tone="orange" label="Racha actual" value="5 dias" detail="Sigue asi" />
        <MetricCard icon={FolderOpen} tone="blue" label="Apuntes guardados" value="24" detail="documentos" />
      </div>

      <div className="dashboard-grid">
        <section className="panel notes-panel">
          <div className="panel-heading"><h2>Mis Apuntes Recientes</h2><button className="link-button" onClick={() => onChangeView('notes')}>Ver todos</button></div>
          <div className="document-list compact">{notes.slice(0, 4).map(note => <NoteRow note={note} key={note.title} />)}</div>
        </section>

        <section className="panel timer-panel">
          <h2>Pomodoro</h2>
          <TimerRing seconds={seconds} />
          <button className="primary-button wide" onClick={onToggleTimer}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? 'Pausar' : 'Iniciar'}</button>
          <button className="secondary-button wide" onClick={() => onChangeView('pomodoro')}><TimerReset size={18} />Sesiones</button>
        </section>

        <section className="side-stack">
          <article className="panel">
            <div className="panel-heading"><h2>Estadisticas Semanales</h2><select><option>Esta semana</option></select></div>
            <BarChart />
          </article>
          <article className="panel technique-card">
            <span className="metric-icon green"><Lightbulb size={28} /></span>
            <div><h2>Tecnica recomendada</h2><strong>Pomodoro</strong><p>Ideal para mantener el enfoque y mejorar tu productividad.</p><button className="secondary-button" onClick={() => onChangeView('techniques')}>Ver mas tecnicas</button></div>
          </article>
        </section>
      </div>

      <AssistantStrip />
    </section>
  );
}

function NotesView() {
  return (
    <section className="view active">
      <div className="section-toolbar">
        <div className="tabs"><button className="active">Todos</button><button>Biologia</button><button>Matematica</button><button>Historia</button><button>Quimica</button></div>
        <div className="toolbar-actions"><button className="icon-button" aria-label="Buscar"><Search size={20} /></button><button className="primary-button"><Upload size={18} />Subir apunte</button></div>
      </div>
      <div className="panel document-list">{notes.map(note => <NoteRow note={note} key={note.title} />)}</div>
    </section>
  );
}

function PomodoroView({ seconds, running, onToggleTimer, onResetTimer }) {
  return (
    <section className="view active"><div className="mobile-screen panel centered-screen">
      <div className="tabs full"><button className="active">Estudio</button><button>Descanso</button></div>
      <TimerRing seconds={seconds} large />
      <button className="primary-button wide" onClick={onToggleTimer}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? 'Pausar' : 'Iniciar'}</button>
      <button className="secondary-button wide" onClick={onResetTimer}><RotateCcw size={18} />Reiniciar</button>
      <div className="session-summary"><div><strong>3</strong><span>Completadas</span></div><div><strong>1h 15m</strong><span>Tiempo total</span></div></div>
    </div></section>
  );
}

function StatsView() {
  return (
    <section className="view active"><div className="stats-layout">
      <section className="panel"><select className="full-select"><option>Esta semana</option></select><h2>Horas de estudio</h2><strong className="big-number">18.5 h</strong><small className="positive">12% mas que la semana pasada</small><BarChart tall /></section>
      <section className="panel"><h2>Tiempo por materia</h2><div className="donut" /><ul className="subject-list"><li><span className="dot green" />Biologia <b>6.5 h</b></li><li><span className="dot purple" />Matematica <b>4.8 h</b></li><li><span className="dot orange" />Historia <b>3.2 h</b></li><li><span className="dot blue" />Quimica <b>2.5 h</b></li></ul></section>
    </div></section>
  );
}

function AssistantStrip() {
  const [sent, setSent] = useState(false);
  return (
    <section className="panel assistant-strip">
      <h2><Sparkles size={20} />Asistente IA</h2>
      <p>{sent ? 'Listo, el asistente esta preparando una respuesta.' : 'Preguntame lo que necesites sobre tus temas de estudio.'}</p>
      <form className="ask-form" onSubmit={(event) => { event.preventDefault(); setSent(true); event.currentTarget.reset(); }}><input placeholder="Escribe tu pregunta aqui..." /><button type="submit" aria-label="Enviar"><Send size={20} /></button></form>
    </section>
  );
}

function AssistantView() {
  return (
    <section className="view active"><div className="panel ai-panel">
      <div className="sparkle"><Sparkles size={36} /></div><h2>En que puedo ayudarte hoy?</h2>
      <div className="ai-actions"><button><strong>Resumir este PDF</strong><span>Genera un resumen de mis apuntes.</span><FileText size={22} /></button><button><strong>Explicarme un tema</strong><span>Explicame algun concepto dificil.</span><Brain size={22} /></button><button><strong>Crear preguntas</strong><span>Genera preguntas de practica.</span><BookOpen size={22} /></button></div>
      <AssistantStrip />
    </div></section>
  );
}

function CalendarView() {
  const days = [29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 1, 2];
  return (
    <section className="view active"><div className="panel calendar-panel"><div className="panel-heading"><IconButton label="Mes anterior"><ChevronLeft size={18} /></IconButton><h2>Mayo 2024</h2><IconButton label="Mes siguiente"><ChevronRight size={18} /></IconButton></div><div className="calendar-grid">{days.map((day, index) => <span className={`${index < 2 || index > 32 ? 'muted-day' : ''} ${day === 21 && index === 22 ? 'selected' : ''}`} key={`${day}-${index}`}>{day}</span>)}</div><h3>Martes 21 de Mayo</h3><div className="event-card"><span /><div><strong>Estudiar Biologia</strong><small>18:00 - 19:30</small></div><button><MoreHorizontal size={18} /></button></div><div className="event-card"><span className="orange-dot" /><div><strong>Repasar Matematica</strong><small>20:00 - 21:00</small></div><button><MoreHorizontal size={18} /></button></div></div></section>
  );
}

function TechniquesView() {
  return (
    <section className="view active"><div className="panel techniques-list"><div className="tabs"><button className="active">Todas</button><button>Productividad</button><button>Memorizacion</button><button>Comprension</button></div>{techniques.map(({ icon: Icon, title, body }) => <article className="technique-row" key={title}><span className="technique-emoji"><Icon size={32} /></span><div><strong>{title}</strong><p>{body}</p></div><button aria-label="Abrir tecnica"><ChevronRight size={20} /></button></article>)}</div></section>
  );
}

function ProfileView() {
  return (
    <section className="view active"><div className="panel profile-panel"><div className="profile-head"><div className="avatar large"><User size={42} /></div><div><h2>Usuario</h2><p>estudiante@mail.com</p><button className="primary-button small">Editar perfil</button></div></div><div className="profile-stats"><p><Flame size={20} />Racha actual <b>5 dias</b></p><p><Clock3 size={20} />Horas totales <b>48.5 h</b></p><p><Target size={20} />Sesiones completadas <b>32</b></p><p><FolderOpen size={20} />Apuntes guardados <b>24</b></p><p><BarChart3 size={20} />Mi progreso <b><ChevronRight size={18} /></b></p><p><Trophy size={20} />Logros <b><ChevronRight size={18} /></b></p></div></div></section>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [seconds, setSeconds] = useState(1500);
  const [running, setRunning] = useState(false);

  useMemo(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setSeconds(value => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const changeView = (view) => {
    setActiveView(view);
    setMenuOpen(false);
  };

  const resetTimer = () => {
    setRunning(false);
    setSeconds(1500);
  };

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onChangeView={changeView} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="main-content">
        <Header activeView={activeView} onMenu={() => setMenuOpen(true)} onChangeView={changeView} />
        {activeView === 'home' && <HomeView seconds={seconds} running={running} onToggleTimer={() => setRunning(value => !value)} onChangeView={changeView} />}
        {activeView === 'notes' && <NotesView />}
        {activeView === 'pomodoro' && <PomodoroView seconds={seconds} running={running} onToggleTimer={() => setRunning(value => !value)} onResetTimer={resetTimer} />}
        {activeView === 'stats' && <StatsView />}
        {activeView === 'assistant' && <AssistantView />}
        {activeView === 'calendar' && <CalendarView />}
        {activeView === 'techniques' && <TechniquesView />}
        {activeView === 'profile' && <ProfileView />}
      </main>
      <nav className="bottom-nav" aria-label="Navegacion movil">
        {navItems.filter(item => ['home', 'notes', 'pomodoro', 'stats', 'profile'].includes(item.id)).map(({ id, label, icon: Icon }) => <button className={`nav-item ${activeView === id ? 'active' : ''}`} key={id} onClick={() => changeView(id)}><Icon size={20} /><span>{label.replace('Mis ', '')}</span></button>)}
      </nav>
    </div>
  );
}

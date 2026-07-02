import { useState } from 'react';
import { Pause, Pencil, Play, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);
const formatTime = (value) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const formatDate = (value) => new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));

function TimerRing({ seconds, large = false }) {
  const progress = Math.max(0, Math.min(1, seconds / (25 * 60)));
  return <div className={`timer-ring ${large ? 'large' : ''}`} style={{ '--progress': progress }}><span>{formatTime(seconds)}</span><small>Tiempo de estudio</small></div>;
}

function QuickForm({ title, children, onSubmit, editing, onCancel, submitting = false, submitLabel }) {
  return <form className="quick-form" onSubmit={onSubmit}><div className="form-heading"><h3>{title}</h3>{editing ? <button type="button" className="link-button" onClick={onCancel}>Cancelar</button> : null}</div>{children}<button className="primary-button" type="submit" disabled={submitting}>{submitting ? <Upload size={17} /> : editing ? <Pencil size={17} /> : <Plus size={17} />}{submitting ? submitLabel || 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar'}</button></form>;
}

function RowActions({ onEdit, onDelete }) {
  return <div className="row-actions"><button type="button" onClick={onEdit} aria-label="Editar"><Pencil size={17} /></button><button type="button" onClick={onDelete} aria-label="Borrar"><Trash2 size={17} /></button></div>;
}

export default function PomodoroView({ data, timer, running, toggleTimer, resetTimer, addSession, updateSession, deleteSession }) {
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

  return <section className="view active"><div className="content-grid"><div className="mobile-screen panel centered-screen"><div className="tabs full"><button className="active">Estudio</button><button>Descanso</button></div><TimerRing seconds={timer} large /><select className="full-select" value={subject} onChange={(event) => setSubject(event.target.value)}>{data.subjects.map((item) => <option key={item.id}>{item.name}</option>)}</select><button className="primary-button wide" onClick={toggleTimer}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? 'Pausar' : 'Iniciar'}</button><button className="secondary-button wide" onClick={resetTimer}><RotateCcw size={18} />Reiniciar</button><button className="secondary-button wide" onClick={() => addSession({ subject, minutes: 25 })}><Plus size={18} />Registrar sesion de 25 min</button><div className="session-summary"><div><strong>{data.sessions.length}</strong><span>Completadas</span></div><div><strong>{Math.round(data.sessions.reduce((total, item) => total + item.minutes, 0) / 60)} h</strong><span>Tiempo total</span></div></div></div><div className="panel session-panel"><QuickForm title={editing ? 'Editar sesion' : 'Registrar sesion manual'} editing={Boolean(editing)} onCancel={() => setEditing(null)} onSubmit={submitSession}><select name="subject" defaultValue={editing?.subject || subject} key={`session-subject-${editing?.id || 'new'}`}>{data.subjects.map((item) => <option key={item.id}>{item.name}</option>)}</select><input name="minutes" min="1" type="number" placeholder="Minutos" defaultValue={editing?.minutes || 25} key={`session-minutes-${editing?.id || 'new'}`} /><input name="date" type="date" defaultValue={editing?.date || today()} key={`session-date-${editing?.id || 'new'}`} /></QuickForm><div className="session-list"><h3>Historial</h3>{data.sessions.map((session) => <article className="session-card" key={session.id}><div><strong>{session.subject}</strong><small>{session.minutes} min - {formatDate(session.date)}</small></div><RowActions onEdit={() => setEditing(session)} onDelete={() => window.confirm('Borrar esta sesion?') && deleteSession(session.id)} /></article>)}</div></div></div></section>;
}

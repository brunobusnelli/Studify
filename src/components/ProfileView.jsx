import { useState } from 'react';
import { BarChart3, Clock3, Flame, FolderOpen, LogOut, Pencil, Plus, Target, Trash2, Trophy, Upload, User } from 'lucide-react';

function RowActions({ onEdit, onDelete }) {
  return <div className="row-actions"><button type="button" onClick={onEdit} aria-label="Editar"><Pencil size={17} /></button><button type="button" onClick={onDelete} aria-label="Borrar"><Trash2 size={17} /></button></div>;
}

function QuickForm({ title, children, onSubmit, editing, onCancel, submitting = false, submitLabel }) {
  return <form className="quick-form" onSubmit={onSubmit}><div className="form-heading"><h3>{title}</h3>{editing ? <button type="button" className="link-button" onClick={onCancel}>Cancelar</button> : null}</div>{children}<button className="primary-button" type="submit" disabled={submitting}>{submitting ? <Upload size={17} /> : editing ? <Pencil size={17} /> : <Plus size={17} />}{submitting ? submitLabel || 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar'}</button></form>;
}

export default function ProfileView({ data, addSubject, updateSubject, deleteSubject, summary, user, onLogout, sync }) {
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

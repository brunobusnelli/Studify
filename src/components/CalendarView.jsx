import { useState } from 'react';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (value) => new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
const daysUntil = (value) => Math.max(0, Math.ceil((new Date(`${value}T00:00:00`) - new Date(`${today()}T00:00:00`)) / 86400000));
const topicsToText = (topics) => topics.join(', ');
const textToTopics = (value) => String(value).split(',').map((item) => item.trim()).filter(Boolean);

function RowActions({ onEdit, onDelete }) {
  return <div className="row-actions"><button type="button" onClick={onEdit} aria-label="Editar"><Pencil size={17} /></button><button type="button" onClick={onDelete} aria-label="Borrar"><Trash2 size={17} /></button></div>;
}

function QuickForm({ title, children, onSubmit, editing, onCancel, submitting = false, submitLabel }) {
  return <form className="quick-form" onSubmit={onSubmit}><div className="form-heading"><h3>{title}</h3>{editing ? <button type="button" className="link-button" onClick={onCancel}>Cancelar</button> : null}</div>{children}<button className="primary-button" type="submit" disabled={submitting}>{submitting ? <Upload size={17} /> : editing ? <Pencil size={17} /> : <Plus size={17} />}{submitting ? submitLabel || 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar'}</button></form>;
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
    <strong>{exam.title}</strong><p>{exam.subject} - {formatDate(exam.date)}</p>
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

export default function CalendarView({ data, addExam, updateExam, deleteExam, toggleTopic }) {
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

  return <section className="view active"><div className="content-grid"><div><ExamFocus exam={nextExam} toggleTopic={toggleTopic} /><div className="panel exam-list"><h2>Todos los examenes</h2>{data.exams.map((exam) => <article className="exam-card" key={exam.id}><div><strong>{exam.title}</strong><small>{exam.subject} - {formatDate(exam.date)} - faltan {daysUntil(exam.date)} dias</small></div><span>{Math.round((exam.completedTopics.length / Math.max(exam.topics.length, 1)) * 100)}%</span><RowActions onEdit={() => setEditing(exam)} onDelete={() => window.confirm('Borrar este examen?') && deleteExam(exam.id)} /></article>)}</div></div><div className="panel"><QuickForm title={editing ? 'Editar examen' : 'Nuevo examen'} editing={Boolean(editing)} onCancel={() => setEditing(null)} onSubmit={submitExam}><input name="title" required placeholder="Nombre del examen" defaultValue={editing?.title || ''} key={`exam-title-${editing?.id || 'new'}`} /><select name="subject" defaultValue={editing?.subject || data.subjects[0]?.name} key={`exam-subject-${editing?.id || 'new'}`}>{data.subjects.map((subject) => <option key={subject.id}>{subject.name}</option>)}</select><input name="date" required type="date" defaultValue={editing?.date || ''} key={`exam-date-${editing?.id || 'new'}`} /><input name="estimatedHours" min="1" type="number" placeholder="Horas estimadas" defaultValue={editing?.estimatedHours || ''} key={`exam-hours-${editing?.id || 'new'}`} /><textarea name="topics" required placeholder="Temas separados por coma" defaultValue={editing ? topicsToText(editing.topics) : ''} key={`exam-topics-${editing?.id || 'new'}`} /></QuickForm></div></div></section>;
}

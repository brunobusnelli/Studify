import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { loadAssistantResponses } from '../lib/studyAssistantApi.js';
import { getStudyFileUrl, uploadStudyFile } from '../lib/studyFiles.js';

const formatDate = (value) => new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));

function QuickForm({ title, children, onSubmit, editing, onCancel, submitting = false, submitLabel }) {
  return <form className="quick-form" onSubmit={onSubmit}><div className="form-heading"><h3>{title}</h3>{editing ? <button type="button" className="link-button" onClick={onCancel}>Cancelar</button> : null}</div>{children}<button className="primary-button" type="submit" disabled={submitting}>{submitting ? <Upload size={17} /> : editing ? <Pencil size={17} /> : <Plus size={17} />}{submitting ? submitLabel || 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar'}</button></form>;
}

function NoteRow({ note, onEdit, onDelete, onOpen, onSelect, active = false }) {
  const storageLabel = note.storage === 'supabase' ? 'Supabase' : note.fileName ? 'archivo local' : 'manual';
  return <article className={`document-row editable-row ${active ? 'active' : ''}`} onClick={onSelect}><span className={`file-icon ${note.type === 'DOC' ? 'doc' : ''}`}>{note.type}</span><div><strong>{note.title}</strong><small>{note.subject} - {formatDate(note.date)} - {note.size} - {storageLabel}</small>{note.fileName ? <em>{note.fileName}</em> : null}</div><div className="row-actions">{note.filePath ? <button className="open-file-action" type="button" onClick={(event) => { event.stopPropagation(); onOpen?.(); }} aria-label="Abrir archivo"><ExternalLink size={17} /><span>Abrir</span></button> : null}<button type="button" onClick={(event) => { event.stopPropagation(); onEdit(); }} aria-label="Editar"><Pencil size={17} /><span>Editar</span></button><button type="button" onClick={(event) => { event.stopPropagation(); onDelete(); }} aria-label="Borrar"><Trash2 size={17} /><span>Borrar</span></button></div></article>;
}

export default function NotesView({ data, addNote, updateNote, deleteNote }) {
  const [filter, setFilter] = useState('Todos');
  const [editing, setEditing] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(data.notes[0]?.id || '');
  const [assistantHistory, setAssistantHistory] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const submitLock = useRef(false);
  const visible = filter === 'Todos' ? data.notes : data.notes.filter((note) => note.subject === filter);
  const selectedNote = data.notes.find((note) => note.id === selectedNoteId) || visible[0] || data.notes[0];
  const selectedHistory = assistantHistory.filter((item) => item.noteId === selectedNote?.id);

  useEffect(() => {
    if (!data.notes.length) {
      setSelectedNoteId('');
      return;
    }
    if (!selectedNoteId || !data.notes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(data.notes[0].id);
    }
  }, [data.notes, selectedNoteId]);

  useEffect(() => {
    let active = true;
    loadAssistantResponses()
      .then((responses) => { if (active) setAssistantHistory(responses); })
      .catch(() => { if (active) setAssistantHistory([]); });
    return () => { active = false; };
  }, []);

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

  return <section className="view active"><div className="content-grid"><div><div className="section-toolbar"><div className="tabs"><button className={filter === 'Todos' ? 'active' : ''} onClick={() => setFilter('Todos')}>Todos</button>{data.subjects.map((subject) => <button className={filter === subject.name ? 'active' : ''} key={subject.id} onClick={() => setFilter(subject.name)}>{subject.name}</button>)}</div><div className="toolbar-actions"><button className="icon-button" aria-label="Buscar"><Search size={20} /></button><button className="primary-button" type="button" disabled={isUploading} onClick={() => document.getElementById('study-file-input')?.click()}><Upload size={18} />Subir apunte</button></div></div><div className="panel document-list">{visible.map((note) => <NoteRow note={note} key={note.id} active={selectedNote?.id === note.id} onSelect={() => setSelectedNoteId(note.id)} onOpen={() => openNote(note)} onEdit={() => setEditing(note)} onDelete={() => window.confirm('Borrar este apunte?') && deleteNote(note.id)} />)}</div></div><div className="panel note-side-panel">{selectedNote ? <div className="note-detail"><div className="panel-heading"><h2>Detalle</h2><span className="status-pill">{selectedNote.type}</span></div><strong>{selectedNote.title}</strong><small>{selectedNote.subject} - {formatDate(selectedNote.date)} - {selectedNote.size}</small>{selectedNote.fileName ? <p className="muted">{selectedNote.fileName}</p> : null}<div className="note-detail-actions"><button type="button" className="secondary-button compact" onClick={() => openNote(selectedNote)}><ExternalLink size={16} />Abrir archivo</button><button type="button" className="secondary-button compact" onClick={() => setEditing(selectedNote)}><Pencil size={16} />Editar</button></div><div className="note-ai-history"><div className="panel-heading"><h3>IA guardada</h3><span>{selectedHistory.length}</span></div>{selectedHistory.length ? selectedHistory.slice(0, 4).map((item) => <article key={item.id}><strong>{item.mode === 'summary' ? 'Resumen' : item.mode === 'explain' ? 'Explicacion' : 'Preguntas'}</strong><small>{new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(item.createdAt))}</small></article>) : <p className="empty-state">Todavia no hay respuestas IA para este apunte.</p>}</div></div> : <p className="empty-state">Selecciona un apunte para ver el detalle.</p>}<QuickForm title={editing ? 'Editar apunte' : 'Nuevo apunte'} editing={Boolean(editing)} onCancel={() => { setEditing(null); setUploadStatus(''); }} onSubmit={submitNote} submitting={isUploading} submitLabel="Subiendo..."><input name="title" placeholder="Titulo del apunte" defaultValue={editing?.title || ''} key={`title-${editing?.id || 'new'}`} /><select name="subject" defaultValue={editing?.subject || data.subjects[0]?.name} key={`subject-${editing?.id || 'new'}`}>{data.subjects.map((subject) => <option key={subject.id}>{subject.name}</option>)}</select><select name="type" defaultValue={editing?.type || 'PDF'} key={`type-${editing?.id || 'new'}`}><option>PDF</option><option>DOC</option><option>LINK</option></select><label className="file-upload-box" htmlFor="study-file-input"><Upload size={19} /><span>Seleccionar PDF, DOC o DOCX</span><small>{editing?.fileName || 'Si Supabase esta activo, se sube al bucket study-files.'}</small></label><input id="study-file-input" className="file-input" name="file" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={isUploading} />{uploadStatus ? <p className="upload-status">{uploadStatus}</p> : null}</QuickForm></div></div></section>;
}

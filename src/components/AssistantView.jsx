import { useEffect, useState } from 'react';
import { BookOpen, Brain, Copy, FileText, Send, Sparkles, TimerReset, Trash2 } from 'lucide-react';
import { askStudyAssistant, deleteAssistantResponse, loadAssistantResponses } from '../lib/studyAssistantApi.js';

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

const stripMarkdownMarks = (value) => value.replace(/\*\*(.*?)\*\*/g, '$1').trim();
const isHeadingLine = (value) => /^\*\*.+\*\*:?$/.test(value.trim()) || /^#{1,3}\s+/.test(value.trim());
const isBulletLine = (value) => /^[-*]\s+/.test(value.trim());
const isNumberedLine = (value) => /^\d+\.\s+/.test(value.trim());
const assistantFileWarning = 'El asistente IA por ahora analiza archivos PDF. Converti este DOC/DOCX a PDF y volvelo a subir.';
const canUseAssistantFile = (note) => {
  const name = note?.fileName?.toLowerCase() || '';
  return Boolean(note?.filePath && (note?.type === 'PDF' || name.endsWith('.pdf')));
};

function AssistantAnswer({ text }) {
  const blocks = cleanAssistantText(text).split('\n').map((line) => line.trim()).filter(Boolean);
  const items = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const line = blocks[index];
    if (isHeadingLine(line)) {
      items.push({ type: 'heading', text: stripMarkdownMarks(line.replace(/^#{1,3}\s+/, '').replace(/:$/, '')) });
      continue;
    }
    if (isBulletLine(line) || isNumberedLine(line)) {
      const list = [];
      while (index < blocks.length && (isBulletLine(blocks[index]) || isNumberedLine(blocks[index]))) {
        list.push(stripMarkdownMarks(blocks[index].replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')));
        index += 1;
      }
      index -= 1;
      items.push({ type: 'list', items: list });
      continue;
    }
    items.push({ type: 'paragraph', text: stripMarkdownMarks(line) });
  }

  return <div className="assistant-answer">{items.map((item, index) => {
    if (item.type === 'heading') return <h3 key={`${item.type}-${index}`}>{item.text}</h3>;
    if (item.type === 'list') return <ul key={`${item.type}-${index}`}>{item.items.map((entry) => <li key={entry}>{entry}</li>)}</ul>;
    return <p key={`${item.type}-${index}`}>{item.text}</p>;
  })}</div>;
}

export default function AssistantView({ data, addSession, changeView }) {
  const notesWithFiles = data.notes.filter((note) => note.filePath || note.fileName);
  const [selectedNoteId, setSelectedNoteId] = useState(notesWithFiles[0]?.id || data.notes[0]?.id || '');
  const [mode, setMode] = useState('summary');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [assistantStatus, setAssistantStatus] = useState({ state: 'idle', message: '' });
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyStatus, setHistoryStatus] = useState('');

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
  const canAnalyzeSelectedNote = canUseAssistantFile(selectedNote);

  useEffect(() => {
    setAnswer('');
    setAssistantStatus(canAnalyzeSelectedNote || !selectedNote ? { state: 'idle', message: '' } : { state: 'warning', message: assistantFileWarning });
  }, [selectedNoteId, mode, canAnalyzeSelectedNote, selectedNote]);

  useEffect(() => {
    let active = true;
    loadAssistantResponses()
      .then((responses) => {
        if (!active) return;
        setHistory(responses);
        setHistoryStatus('');
      })
      .catch((error) => {
        if (!active) return;
        setHistory([]);
        setHistoryStatus(error.message || 'No se pudo cargar el historial.');
      });
    return () => { active = false; };
  }, []);

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
    if (!canAnalyzeSelectedNote) {
      setAnswer('');
      setAssistantStatus({ state: 'warning', message: assistantFileWarning });
      return;
    }
    setAssistantStatus({ state: 'loading', message: 'Consultando Gemini...' });
    setAnswer('');
    try {
      const result = await askStudyAssistant({ noteId: selectedNoteId, mode, question });
      setAnswer(cleanAssistantText(result.answer || 'Gemini respondio sin texto.'));
      setAssistantStatus({ state: result.warning ? 'warning' : 'ready', message: result.warning || 'Respuesta generada con Gemini.' });
      if (result.savedId) {
        setHistory((current) => [{
          id: result.savedId,
          noteId: selectedNoteId,
          mode,
          question,
          answer: cleanAssistantText(result.answer || ''),
          provider: result.source,
          createdAt: result.savedAt
        }, ...current.filter((item) => item.id !== result.savedId)].slice(0, 30));
      }
    } catch (error) {
      setAssistantStatus({ state: 'error', message: error.message || 'No se pudo consultar Gemini.' });
    }
  };

  const visibleHistory = history.filter((item) => item.noteId === selectedNoteId);
  const outputText = answer || (assistantStatus.state === 'error' || !canAnalyzeSelectedNote ? '' : suggestions[mode].join('\n\n'));
  const statusLabel = assistantStatus.state === 'loading' ? 'Gemini' : assistantStatus.state === 'ready' ? 'Listo' : assistantStatus.state === 'error' ? 'Error' : assistantStatus.state === 'warning' ? 'Aviso' : 'Borrador';

  const copyAnswer = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const removeHistoryItem = async (event, item) => {
    event.stopPropagation();
    if (!window.confirm('Borrar esta respuesta guardada?')) return;
    try {
      await deleteAssistantResponse(item.id);
      setHistory((current) => current.filter((entry) => entry.id !== item.id));
      setAssistantStatus({ state: 'ready', message: 'Respuesta guardada eliminada.' });
      if (cleanAssistantText(item.answer) === answer) setAnswer('');
    } catch (error) {
      setAssistantStatus({ state: 'error', message: error.message || 'No se pudo borrar la respuesta.' });
    }
  };

  const registerStudyBlock = () => {
    if (!selectedNote) return;
    addSession({ subject: selectedNote.subject || 'General', minutes: 25 });
    setAssistantStatus({ state: 'ready', message: `Sesion de 25 min registrada para ${selectedNote.subject || 'General'}.` });
    changeView('pomodoro');
  };

  return <section className="view active"><div className="assistant-workspace"><div className="panel ai-panel"><div className="sparkle"><Sparkles size={36} /></div><h2>IA Asistente</h2><p className="muted">Elegi un apunte y una accion para preparar tu estudio.</p><div className="ai-actions">{actionButtons.map(([key, Icon, title, body]) => <button type="button" className={mode === key ? 'active' : ''} key={key} onClick={() => setMode(key)}><div><strong>{title}</strong><span>{body}</span></div><Icon size={22} /></button>)}</div><div className="assistant-history"><div className="panel-heading"><h2>Guardados</h2><span>{visibleHistory.length}</span></div>{historyStatus ? <p className="empty-state">{historyStatus}</p> : visibleHistory.length ? visibleHistory.slice(0, 6).map((item) => <article className="history-item" key={item.id} onClick={() => { setMode(item.mode); setQuestion(item.question || ''); setAnswer(cleanAssistantText(item.answer)); setAssistantStatus({ state: 'ready', message: 'Respuesta cargada del historial.' }); }}><button type="button"><strong>{modeLabels[item.mode] || 'Respuesta'}</strong><span>{new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(item.createdAt))}</span></button><button type="button" className="history-delete" aria-label="Borrar respuesta guardada" onClick={(event) => removeHistoryItem(event, item)}><Trash2 size={15} /></button></article>) : <p className="empty-state">Todavia no hay respuestas guardadas para este apunte.</p>}</div></div><div className="panel assistant-panel"><div className="panel-heading"><h2>{modeLabels[mode]}</h2><span className={`status-pill ${assistantStatus.state}`}>{statusLabel}</span></div>{data.notes.length ? <><label className="note-picker"><span>Apunte</span><select value={selectedNoteId} onChange={(event) => setSelectedNoteId(event.target.value)}>{data.notes.map((note) => <option key={note.id} value={note.id}>{note.title}</option>)}</select></label><form className="assistant-composer" onSubmit={submitAssistant}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Escribe una duda o tema puntual..." /><button type="submit" aria-label="Enviar" disabled={assistantStatus.state === 'loading' || !canAnalyzeSelectedNote}><Send size={20} /></button></form>{assistantStatus.message ? <p className={`save-status ${assistantStatus.state}`}>{assistantStatus.message}</p> : null}<div className="assistant-output"><div className="assistant-output-head"><div><strong>{selectedNote?.title}</strong><small>{selectedNote?.subject} - {selectedNote?.type} - {selectedNote?.size}</small></div><div className="assistant-output-actions"><button type="button" className="secondary-button compact" onClick={registerStudyBlock}><TimerReset size={16} />Estudiar 25 min</button><button type="button" className="secondary-button compact" onClick={copyAnswer}><Copy size={16} />{copied ? 'Copiado' : 'Copiar'}</button></div></div>{outputText ? <AssistantAnswer text={outputText} /> : <p className="empty-state">Converti este apunte a PDF para que Gemini pueda leer el contenido.</p>}</div></> : <p className="empty-state">Subi un apunte para empezar a trabajar con el asistente.</p>}</div></div></section>;
}

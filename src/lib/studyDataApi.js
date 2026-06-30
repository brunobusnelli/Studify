import { isSupabaseConfigured, supabase } from './supabaseClient.js';

async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

function subjectName(subjects, subjectId) {
  return subjects.find((subject) => subject.id === subjectId)?.name || 'Sin materia';
}

function subjectId(subjects, name) {
  return subjects.find((subject) => subject.name === name)?.id || null;
}

export async function loadRemoteStudyData() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [subjectsResponse, notesResponse, examsResponse, sessionsResponse] = await Promise.all([
    supabase.from('subjects').select('*').order('created_at', { ascending: true }),
    supabase.from('notes').select('*').order('created_at', { ascending: false }),
    supabase.from('exams').select('*').order('exam_date', { ascending: true }),
    supabase.from('study_sessions').select('*').order('session_date', { ascending: false })
  ]);

  const firstError = subjectsResponse.error || notesResponse.error || examsResponse.error || sessionsResponse.error;
  if (firstError) throw firstError;

  const subjects = subjectsResponse.data.map((subject) => ({
    id: subject.id,
    name: subject.name,
    color: subject.color,
    targetHours: Number(subject.target_hours || 5)
  }));

  return {
    userId: user.id,
    data: {
      subjects,
      notes: notesResponse.data.map((note) => ({
        id: note.id,
        title: note.title,
        subject: subjectName(subjects, note.subject_id),
        subjectId: note.subject_id,
        date: note.created_at.slice(0, 10),
        size: note.file_size || 'Manual',
        type: note.file_type || 'PDF',
        fileName: note.file_name || null,
        filePath: note.file_path || null,
        storage: note.storage || (note.file_path ? 'supabase' : 'manual')
      })),
      exams: examsResponse.data.map((exam) => ({
        id: exam.id,
        title: exam.title,
        subject: subjectName(subjects, exam.subject_id),
        subjectId: exam.subject_id,
        date: exam.exam_date,
        estimatedHours: Number(exam.estimated_hours || 5),
        topics: exam.topics || [],
        completedTopics: exam.completed_topics || []
      })),
      sessions: sessionsResponse.data.map((session) => ({
        id: session.id,
        subject: subjectName(subjects, session.subject_id),
        subjectId: session.subject_id,
        minutes: session.minutes,
        date: session.session_date
      }))
    }
  };
}

export async function createRemoteSubject(userId, subject) {
  const { data, error } = await supabase.from('subjects').insert({
    user_id: userId,
    name: subject.name,
    color: subject.color,
    target_hours: subject.targetHours
  }).select().single();
  if (error) throw error;
  return { id: data.id, name: data.name, color: data.color, targetHours: Number(data.target_hours || 5) };
}

export async function updateRemoteSubject(subjectIdValue, patch) {
  const payload = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.color !== undefined) payload.color = patch.color;
  if (patch.targetHours !== undefined) payload.target_hours = patch.targetHours;
  const { error } = await supabase.from('subjects').update(payload).eq('id', subjectIdValue);
  if (error) throw error;
}

export async function deleteRemoteSubject(subjectIdValue) {
  const { error } = await supabase.from('subjects').delete().eq('id', subjectIdValue);
  if (error) throw error;
}

export async function createRemoteNote(userId, subjects, note) {
  const { data, error } = await supabase.from('notes').insert({
    user_id: userId,
    subject_id: subjectId(subjects, note.subject),
    title: note.title,
    file_type: note.type,
    file_path: note.filePath,
    file_size: note.size,
    file_name: note.fileName,
    storage: note.storage
  }).select().single();
  if (error) throw error;
  return data.id;
}

export async function updateRemoteNote(noteId, subjects, patch) {
  const payload = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.subject !== undefined) payload.subject_id = subjectId(subjects, patch.subject);
  if (patch.type !== undefined) payload.file_type = patch.type;
  if (patch.filePath !== undefined) payload.file_path = patch.filePath;
  if (patch.size !== undefined) payload.file_size = patch.size;
  if (patch.fileName !== undefined) payload.file_name = patch.fileName;
  if (patch.storage !== undefined) payload.storage = patch.storage;
  const { error } = await supabase.from('notes').update(payload).eq('id', noteId);
  if (error) throw error;
}

export async function deleteRemoteNote(noteId) {
  const { error } = await supabase.from('notes').delete().eq('id', noteId);
  if (error) throw error;
}

export async function createRemoteExam(userId, subjects, exam) {
  const { data, error } = await supabase.from('exams').insert({
    user_id: userId,
    subject_id: subjectId(subjects, exam.subject),
    title: exam.title,
    exam_date: exam.date,
    estimated_hours: exam.estimatedHours,
    topics: exam.topics,
    completed_topics: exam.completedTopics || []
  }).select().single();
  if (error) throw error;
  return data.id;
}

export async function updateRemoteExam(examId, subjects, patch) {
  const payload = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.subject !== undefined) payload.subject_id = subjectId(subjects, patch.subject);
  if (patch.date !== undefined) payload.exam_date = patch.date;
  if (patch.estimatedHours !== undefined) payload.estimated_hours = patch.estimatedHours;
  if (patch.topics !== undefined) payload.topics = patch.topics;
  if (patch.completedTopics !== undefined) payload.completed_topics = patch.completedTopics;
  const { error } = await supabase.from('exams').update(payload).eq('id', examId);
  if (error) throw error;
}

export async function deleteRemoteExam(examId) {
  const { error } = await supabase.from('exams').delete().eq('id', examId);
  if (error) throw error;
}

export async function createRemoteSession(userId, subjects, session) {
  const { data, error } = await supabase.from('study_sessions').insert({
    user_id: userId,
    subject_id: subjectId(subjects, session.subject),
    minutes: session.minutes,
    session_date: session.date
  }).select().single();
  if (error) throw error;
  return data.id;
}

export async function updateRemoteSession(sessionId, subjects, patch) {
  const payload = {};
  if (patch.subject !== undefined) payload.subject_id = subjectId(subjects, patch.subject);
  if (patch.minutes !== undefined) payload.minutes = patch.minutes;
  if (patch.date !== undefined) payload.session_date = patch.date;
  const { error } = await supabase.from('study_sessions').update(payload).eq('id', sessionId);
  if (error) throw error;
}

export async function deleteRemoteSession(sessionId) {
  const { error } = await supabase.from('study_sessions').delete().eq('id', sessionId);
  if (error) throw error;
}

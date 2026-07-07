import { isSupabaseConfigured, supabase } from './supabaseClient.js';

export async function askStudyAssistant({ noteId, mode, question }) {
  if (!isSupabaseConfigured) {
    throw new Error('Conecta Supabase para usar el asistente IA.');
  }
  if (!noteId) {
    throw new Error('Elegi un apunte para consultar.');
  }

  const { data, error } = await supabase.functions.invoke('study-assistant', {
    body: { noteId, mode, question }
  });

  if (error) {
    let message = error.message || 'No se pudo consultar Gemini.';
    try {
      const payload = await error.context?.json?.();
      if (payload?.error) message = payload.error;
    } catch {
      // Supabase no siempre expone el cuerpo del error.
    }
    throw new Error(message);
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function loadAssistantResponses() {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('assistant_responses')
    .select('id,note_id,mode,question,answer,provider,created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    throw new Error(error.message || 'No se pudo cargar el historial IA.');
  }

  return data.map((item) => ({
    id: item.id,
    noteId: item.note_id,
    mode: item.mode,
    question: item.question || '',
    answer: item.answer,
    provider: item.provider,
    createdAt: item.created_at
  }));
}

export async function deleteAssistantResponse(responseId) {
  if (!isSupabaseConfigured || !responseId) return;

  const { error } = await supabase
    .from('assistant_responses')
    .delete()
    .eq('id', responseId);

  if (error) {
    throw new Error(error.message || 'No se pudo borrar la respuesta guardada.');
  }
}

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
    throw new Error(error.message || 'No se pudo consultar Gemini.');
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

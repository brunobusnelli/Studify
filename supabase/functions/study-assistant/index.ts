import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const modePrompts: Record<string, string> = {
  summary: 'Resume el apunte en secciones claras: ideas principales, conceptos clave, ejemplos y repaso sugerido.',
  explain: 'Explica el tema de forma simple, paso a paso, como para un estudiante que esta preparando un examen.',
  questions: 'Crea preguntas de practica para active recall. Incluye preguntas faciles, medias y desafiantes con respuesta breve.'
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function mimeTypeFor(note: { file_name?: string | null; file_type?: string | null }) {
  const name = note.file_name?.toLowerCase() || '';
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (name.endsWith('.doc')) return 'application/msword';
  return 'application/pdf';
}

function base64FromBytes(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function extractGeminiText(payload: any) {
  if (typeof payload.output_text === 'string') return payload.output_text;
  const stepText = payload.steps
    ?.flatMap((step: any) => step.content || [])
    ?.map((content: any) => content.text)
    ?.filter(Boolean)
    ?.join('\n\n');
  if (stepText) return stepText;
  return payload.candidates?.[0]?.content?.parts?.map((part: any) => part.text).filter(Boolean).join('\n\n') || '';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authHeader = request.headers.get('Authorization') || '';

    if (!geminiKey) return jsonResponse({ error: 'Falta configurar GEMINI_API_KEY en Supabase.' }, 500);
    if (!supabaseUrl || !supabaseAnonKey) return jsonResponse({ error: 'Faltan variables internas de Supabase.' }, 500);
    if (!authHeader) return jsonResponse({ error: 'Inicia sesion para usar el asistente.' }, 401);

    const { noteId, mode = 'summary', question = '' } = await request.json();
    if (!noteId) return jsonResponse({ error: 'Falta elegir un apunte.' }, 400);
    if (!modePrompts[mode]) return jsonResponse({ error: 'Accion de asistente no valida.' }, 400);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return jsonResponse({ error: 'Sesion no valida.' }, 401);

    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id,title,file_path,file_name,file_type,file_size,storage,subjects(name)')
      .eq('id', noteId)
      .eq('user_id', userData.user.id)
      .single();

    if (noteError || !note) return jsonResponse({ error: 'No se encontro el apunte.' }, 404);
    if (!note.file_path) return jsonResponse({ error: 'Este apunte no tiene archivo subido para analizar.' }, 400);

    const { data: signedFile, error: fileError } = await supabase
      .storage
      .from('study-files')
      .createSignedUrl(note.file_path, 120);

    if (fileError || !signedFile?.signedUrl) {
      return jsonResponse({ error: 'No se pudo leer el archivo del apunte.' }, 500);
    }

    const fileResponse = await fetch(signedFile.signedUrl);
    if (!fileResponse.ok) {
      return jsonResponse({ error: 'No se pudo descargar el archivo del apunte.' }, 500);
    }

    const fileBytes = new Uint8Array(await fileResponse.arrayBuffer());
    const subject = Array.isArray(note.subjects) ? note.subjects[0]?.name : note.subjects?.name;
    const prompt = [
      modePrompts[mode],
      '',
      `Apunte: ${note.title}`,
      `Materia: ${subject || 'Sin materia'}`,
      `Tipo: ${note.file_type || 'PDF'}`,
      question ? `Consulta del estudiante: ${question}` : '',
      '',
      'Responde en espanol claro, con formato facil de estudiar. Si el archivo no es legible, decilo sin inventar contenido.'
    ].filter(Boolean).join('\n');

    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'x-goog-api-key': geminiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash',
        input: [
          { type: 'text', text: prompt },
          {
            type: 'document',
            data: base64FromBytes(fileBytes),
            mime_type: mimeTypeFor(note)
          }
        ]
      })
    });

    const geminiPayload = await geminiResponse.json();
    if (!geminiResponse.ok) {
      return jsonResponse({ error: geminiPayload.error?.message || 'Gemini no pudo generar la respuesta.' }, 502);
    }

    return jsonResponse({
      answer: extractGeminiText(geminiPayload),
      mode,
      noteTitle: note.title,
      source: 'gemini'
    });
  } catch (error) {
    return jsonResponse({ error: error.message || 'No se pudo completar la consulta.' }, 500);
  }
});

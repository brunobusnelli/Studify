import { isSupabaseConfigured, supabase } from './supabaseClient.js';

export function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

export function inferFileType(file) {
  const name = file?.name?.toLowerCase() || '';
  if (name.endsWith('.docx')) return 'DOC';
  if (name.endsWith('.doc')) return 'OLD_DOC';
  if (name.endsWith('.pdf')) return 'PDF';
  return 'FILE';
}

export function validateStudyFile(file) {
  const fileType = inferFileType(file);
  const maxBytes = 20 * 1024 * 1024;
  if (fileType === 'OLD_DOC') {
    throw new Error('El formato .doc antiguo no es compatible con IA. Guardalo como DOCX o PDF y volvelo a subir.');
  }
  if (!['PDF', 'DOC'].includes(fileType)) {
    throw new Error('Solo se pueden subir archivos PDF o DOCX.');
  }
  if (file.size > maxBytes) {
    throw new Error('El archivo supera el maximo de 20 MB.');
  }
}

export async function uploadStudyFile(file) {
  if (!file) return null;
  validateStudyFile(file);

  const metadata = {
    fileName: file.name,
    fileSize: formatFileSize(file.size),
    fileType: inferFileType(file),
    filePath: null,
    storage: 'local-metadata'
  };

  if (!isSupabaseConfigured) return metadata;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return metadata;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${userData.user.id}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('study-files').upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) throw error;

  return {
    ...metadata,
    filePath: path,
    storage: 'supabase'
  };
}

export async function getStudyFileUrl(filePath) {
  if (!filePath || !isSupabaseConfigured) return null;
  const { data, error } = await supabase.storage.from('study-files').createSignedUrl(filePath, 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteStudyFile(filePath) {
  if (!filePath || !isSupabaseConfigured) return;
  const { error } = await supabase.storage.from('study-files').remove([filePath]);
  if (error) throw error;
}

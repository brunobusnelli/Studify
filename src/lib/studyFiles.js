import { isSupabaseConfigured, supabase } from './supabaseClient.js';

export function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

export function inferFileType(file) {
  const name = file?.name?.toLowerCase() || '';
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'DOC';
  if (name.endsWith('.pdf')) return 'PDF';
  return 'FILE';
}

export async function uploadStudyFile(file) {
  if (!file) return null;

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

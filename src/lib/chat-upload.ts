import { API_URL, getCsrfToken } from '@/lib/api';

export async function uploadChatImage(file: File): Promise<string | null> {
  if (file.size > 5 * 1024 * 1024) return null;

  const fd = new FormData();
  fd.append('file', file);

  try {
    const res = await fetch(`${API_URL}/v1/cdn/upload/chat`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': getCsrfToken() },
      body: fd,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Falha no upload');
    }
    const data = await res.json();
    return data.url;
  } catch {
    return null;
  }
}

export async function uploadChatImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadChatImage(file);
    if (url) urls.push(url);
  }
  return urls;
}

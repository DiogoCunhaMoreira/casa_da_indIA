import { normalizeLocalUrl, parseLocalModels } from '../shared/localModels';

export async function discoverLocalModels(payload: unknown): Promise<{ ok: boolean; models?: string[]; baseUrl?: string; error?: string }> {
  const p = (payload ?? {}) as { baseUrl?: unknown; key?: unknown };
  let baseUrl: string;
  try { baseUrl = normalizeLocalUrl(typeof p.baseUrl === 'string' ? p.baseUrl : ''); }
  catch { return { ok: false, error: 'invalid_url' }; }
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: typeof p.key === 'string' && p.key ? { Authorization: `Bearer ${p.key}` } : {},
      signal: AbortSignal.timeout(8000), redirect: 'error'
    });
    if (!response.ok) return { ok: false, error: response.status === 401 || response.status === 403 ? 'auth' : 'http' };
    const models = parseLocalModels(await response.json());
    return { ok: true, models, baseUrl };
  } catch (error) {
    return { ok: false, error: error instanceof Error && error.message === 'invalid_response' ? 'invalid_response' : 'connection' };
  }
}

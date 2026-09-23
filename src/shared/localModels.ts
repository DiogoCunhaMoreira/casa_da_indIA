export type LocalServerKind = 'lmstudio' | 'ollama' | 'vllm' | 'other';
export interface LocalConnection {
  id: string;
  kind: LocalServerKind;
  baseUrl: string;
  model: string;
}
export const LOCAL_SERVERS: Record<LocalServerKind, { label: string; url: string }> = {
  lmstudio: { label: 'LM Studio', url: 'http://localhost:1234/v1' },
  ollama: { label: 'Ollama', url: 'http://localhost:11434/v1' },
  vllm: { label: 'vLLM', url: 'http://localhost:8000/v1' },
  other: { label: 'Outro servidor', url: 'http://localhost:8080/v1' }
};
export function localModelSlug(connection: LocalConnection): string {
  return `${connection.id}/${connection.model}`;
}
export function normalizeLocalUrl(value: string): string {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('invalid_url');
  }
  url.pathname = url.pathname.replace(/\/+$/, '').replace(/\/models$/, '');
  if (!url.pathname || url.pathname === '/') url.pathname = '/v1';
  return url.toString().replace(/\/+$/, '');
}
export function parseLocalModels(payload: unknown): string[] {
  const data = (payload as { data?: unknown })?.data;
  if (!Array.isArray(data)) throw new Error('invalid_response');
  return [...new Set(data.flatMap((entry) =>
    typeof entry?.id === 'string' && entry.id.trim() ? [entry.id] : []))].sort();
}

/** Register only the selected connection; credentials never reach the renderer. */
export function localProviderConfig(connections: LocalConnection[], slug: string, getKey: (id: string) => string | undefined): Record<string, unknown> {
  const connection = connections.find(c => localModelSlug(c) === slug);
  if (!connection) return {};
  const key = getKey(connection.id);
  return {
    [connection.id]: {
      npm: '@ai-sdk/openai-compatible', name: LOCAL_SERVERS[connection.kind]?.label ?? connection.kind,
      options: { baseURL: normalizeLocalUrl(connection.baseUrl), ...(key ? { apiKey: key } : {}) },
      models: { [connection.model]: { name: connection.model } }
    }
  };
}

import { app, protocol, type Session } from 'electron';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Must run before app.ready. No CSP bypass and no access to the preload bridge.
protocol.registerSchemesAsPrivileged([{ scheme: 'casa-world', privileges: {
  standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, allowServiceWorkers: true
} }]);
const registered = new WeakSet<Session>();
const mime: Record<string, string> = { html: 'text/html', js: 'text/javascript', wasm: 'application/wasm', pck: 'application/octet-stream', png: 'image/png', svg: 'image/svg+xml' };
export function registerWorldProtocol(session: Session, assetsRoot = app.isPackaged ? join(app.getAppPath(), 'out/renderer/godot') : join(app.getAppPath(), 'src/renderer/public/godot')): void {
  if (registered.has(session)) return;
  session.protocol.handle('casa-world', async request => {
    const url = new URL(request.url);
    const file = url.pathname.slice(1) || 'index.html';
    // Flat export allowlist: nested paths, traversal and arbitrary project files are not served.
    if (request.method !== 'GET' || url.host !== 'app' || !/^(index\.(html|js|wasm|pck|png)|bridge\.js|index\.(icon|apple-touch-icon)\.png)$/.test(file)) return new Response(null, { status: 404 });
    try {
      const data = await readFile(join(assetsRoot, file));
      return new Response(new Uint8Array(data), { headers: {
        'Content-Type': mime[file.split('.').pop()!] || 'application/octet-stream',
        'Content-Security-Policy': "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; worker-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'",
        'X-Content-Type-Options': 'nosniff'
      } });
    } catch { return new Response('O cenário Godot ainda não foi exportado.', { status: 404 }); }
  });
  registered.add(session);
}

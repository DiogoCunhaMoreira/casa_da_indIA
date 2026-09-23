import { app } from 'electron';

export function restartApp(): void {
  // The dev supervisor must restart Vite too: electron-vite closes its HTTP
  // server when Electron exits, leaving app.relaunch() without a renderer.
  if (!app.isPackaged && process.env.CASA_DEV_RESTART === '1') {
    app.exit(75);
    return;
  }
  app.relaunch();
  app.exit(0);
}

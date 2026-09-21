import { describeUpdate, pendingVersion, clampPercent, type UpdateStatus } from '@shared/updateState';
import { uiText } from './uiText';

/** Keep updater transitions/actions unchanged; localise only its presentation. */
export function describeLocalizedUpdate(status: UpdateStatus | null, current: string) {
  const view = describeUpdate(status, current);
  const version = pendingVersion(status, current) ?? current;
  if (status?.state === 'downloading') return {
    ...view, label: uiText('updateProgress', { percent: clampPercent(status.percent) }),
    title: uiText('updateDownloading', { version: status.version, percent: clampPercent(status.percent) })
  };
  if (view.action === 'restart') return { ...view, label: uiText('updateRestart', { version }), title: uiText('updateRestartHint', { version }) };
  if (view.action === 'download' || view.action === 'manual') return { ...view, label: uiText('updateDownload', { version }), title: uiText('updateDownloadHint', { version }) };
  if (status?.state === 'checking') return { ...view, label: uiText('updateChecking'), title: uiText('updateCheckingHint', { version: current }) };
  if (status?.state === 'error') return { ...view, label: uiText('updateFailed'), title: uiText('updateFailedHint', { message: status.message }) };
  if (view.label) return { ...view, label: uiText('updateCurrent'), title: uiText('updateCurrentHint', { version: current }) };
  return { ...view, title: uiText('updateCheckHint', { version: current }) };
}

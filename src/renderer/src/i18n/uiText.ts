import { useTranslation } from 'react-i18next';
import i18n from './index';

/** Shared strings also used by imperative UI actions and error handlers. */
export function uiText(key: string, values?: Record<string, string | number>): string {
  return String(i18n.t(`interface.${key}`, values ?? {}));
}

/** Subscribe components without changing their identity or terminal sessions. */
export function useUiLanguage(): void {
  useTranslation();
}

export function uiLocale(): string {
  return i18n.resolvedLanguage || 'pt-PT';
}

/**
 * i18n bootstrap — react-i18next with inline JSON resources.
 *
 * Portuguese is the default for fresh installations; saved choices are preserved.
 * English remains the fallback for missing keys.
 *
 * Adding a language: drop a `locales/<code>.json` with the exact same key
 * tree as `en.json`, register it in `resources` and `supportedLngs`, and add
 * an entry to `LANGUAGES` (Settings → General exposes the picker from that
 * list). No other code needs to change. Only left-to-right scripts are
 * supported.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_GOD_NAME } from '@shared/godIdentity';
import en from './locales/en.json';
import ptPT from './locales/pt-PT.json';

/** The languages the Settings picker offers, in display order. */
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'pt-PT', label: 'Português (Portugal)' }
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'cth.language';

const SUPPORTED: readonly string[] = LANGUAGES.map((l) => l.code);

/** The language a fresh install starts in. This is a Portuguese app for a
 *  Portuguese audience, so PT-PT is the front door, not an opt-in buried in
 *  Settings. English stays the FALLBACK for any key pt-PT is missing. */
export const DEFAULT_LANGUAGE = 'pt-PT';

/**
 * The orchestrator's display name, for every string that talks about it.
 *
 * The user can rename the god, and roughly forty strings mention it. Baking
 * "Michael" into the locale files would silently undo that rename everywhere at
 * once — a bug this codebase has already fixed three times in the spawn path.
 * So the locales say `{{godName}}` and the live name is supplied here as an
 * i18next DEFAULT VARIABLE, which means no call site has to pass it. A call site
 * that needs a variant (an upper-cased title, say) still overrides it by passing
 * `godName` explicitly.
 */
export function setGodName(name: string | undefined | null): void {
  const next = name?.trim() || DEFAULT_GOD_NAME;
  const interpolation = i18n.options.interpolation ?? (i18n.options.interpolation = {});
  const vars = interpolation.defaultVariables ?? (interpolation.defaultVariables = {});
  if (vars.godName === next) return;
  vars.godName = next;
  // react-i18next re-renders on this event. Without it a rename would only
  // reach strings that happened to re-render for some other reason.
  i18n.emit('languageChanged', i18n.language);
}

/** The saved choice, or Portuguese. Never the OS locale — see the note above. */
function detectLanguage(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved as LanguageCode)) return saved;
  } catch { /* localStorage unavailable — Portuguese it is */ }
  return DEFAULT_LANGUAGE;
}

/** Switch language now and persist the choice for next launch. */
export function setLanguage(lng: string): void {
  void i18n.changeLanguage(lng);
  try { window.localStorage.setItem(STORAGE_KEY, lng); } catch { /* best-effort */ }
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'pt-PT': { translation: ptPT }
    },
    lng: detectLanguage(),
    fallbackLng: 'en',
    supportedLngs: SUPPORTED,
    // Resources are bundled inline, so nothing ever suspends — the string is
    // there at init time. Keeping this false lets every component call
    // useTranslation() without wrapping the tree in <Suspense>.
    react: { useSuspense: false },
    // `defaultVariables` is what lets every {{godName}} string resolve without
    // its call site knowing god's name. setGodName() keeps it current.
    interpolation: { escapeValue: false, defaultVariables: { godName: DEFAULT_GOD_NAME } },
    returnNull: false
  });

export default i18n;

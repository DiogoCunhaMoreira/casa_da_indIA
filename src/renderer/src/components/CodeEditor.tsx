import { uiText, useUiLanguage } from '@/i18n/uiText';
import { useEffect, useMemo, useState, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { yaml } from '@codemirror/lang-yaml';
import { Icon } from './Icon';
import { PixelButton } from './PixelButton';

// ─── Theme matching CTH palette ─────────────────────────────────────────────
const cthEditorTheme = EditorView.theme({
  '&': {
    background: '#FCFAF0',
    color: 'var(--cth-ink-900)',
    height: '100%',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '16px'
  },
  '.cm-content': { caretColor: '#FF6B6B', padding: '8px 0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#FF6B6B', borderLeftWidth: '2px' },
  '.cm-scroller': { fontFamily: 'inherit', overflow: 'auto' },
  '.cm-gutters': {
    background: '#F0EAD2',
    color: 'var(--cth-ink-500)',
    borderRight: '1px solid var(--cth-ink-100)'
  },
  '.cm-activeLineGutter': { background: '#FFEC99' },
  '.cm-activeLine': { background: 'rgba(255, 217, 61, 0.10)' },
  '.cm-selectionBackground, ::selection': { background: '#FFEC99 !important' },
  '.cm-searchMatch': { background: '#A8E6E0', outline: '1px solid var(--cth-ink-900)' },
  '.cm-searchMatch.cm-searchMatch-selected': { background: '#FFD93D' }
}, { dark: false });

const cthSyntax = HighlightStyle.define([
  { tag: tags.keyword,        color: '#B197FC' },
  { tag: tags.operator,       color: 'var(--cth-ink-500)' },
  { tag: [tags.string, tags.regexp], color: '#6BCF7F' },
  { tag: [tags.number, tags.bool, tags.null], color: '#FF6B6B' },
  { tag: tags.comment,        color: 'var(--cth-ink-500)', fontStyle: 'italic' },
  { tag: tags.variableName,   color: 'var(--cth-ink-900)' },
  { tag: tags.function(tags.variableName), color: '#FFA07A' },
  { tag: [tags.typeName, tags.className], color: '#4ECDC4' },
  { tag: tags.propertyName,   color: '#3D2E4A' },
  { tag: tags.heading,        color: 'var(--cth-ink-900)', fontWeight: 'bold' as any },
  { tag: tags.link,           color: '#4ECDC4', textDecoration: 'underline' as any },
  { tag: tags.meta,           color: 'var(--cth-ink-500)' }
]);

function extensionsFor(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (['ts', 'tsx'].includes(ext)) return [javascript({ jsx: true, typescript: true })];
  if (['js', 'jsx', 'mjs', 'cjs'].includes(ext)) return [javascript({ jsx: ext.endsWith('x') })];
  if (ext === 'json') return [json()];
  if (['md', 'markdown'].includes(ext)) return [markdown()];
  if (ext === 'py') return [python()];
  if (['html', 'htm'].includes(ext)) return [html()];
  if (ext === 'css') return [css()];
  if (['yml', 'yaml'].includes(ext)) return [yaml()];
  return [];
}

export interface CodeEditorProps {
  root: string;
  /** Relative file path within `root` */
  filePath: string | null;
  /** Escalate this file into the IDE. The sidebar editor is deliberately
   *  small; the IDE is where tabs, the tree, git, and markdown preview live. */
  onOpenInIde?: () => void;
  onCopyPath?: () => void;
}

export function CodeEditor({
  root, filePath, onOpenInIde, onCopyPath
}: CodeEditorProps) {
  useUiLanguage();
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [absPath, setAbsPath] = useState<string | undefined>();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load file on path change
  useEffect(() => {
    let cancelled = false;
    if (!filePath) {
      setContent(''); setOriginalContent(''); setError(undefined);
      setAbsPath(undefined);
      return;
    }
    setLoading(true);
    setError(undefined);
    window.cth.readFile(root, filePath).then(res => {
      if (cancelled) return;
      setLoading(false);
      if (res.ok) {
        setContent(res.content);
        setOriginalContent(res.content);
        setAbsPath(res.path);
      } else {
        setContent('');
        setOriginalContent('');
        setAbsPath(undefined);
        setError(res.error);
      }
    });
    return () => { cancelled = true; };
  }, [root, filePath]);

  const dirty = content !== originalContent;

  const save = useCallback(async () => {
    if (!filePath || !dirty) return;
    setSaveState('saving');
    const res = await window.cth.writeFile(root, filePath, content);
    if (res.ok) {
      setOriginalContent(content);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1200);
    } else {
      setSaveState('error');
      setError(res.error);
      setTimeout(() => setSaveState('idle'), 4000);
    }
  }, [filePath, dirty, content, root]);

  // Cmd-S to save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  const extensions = useMemo(
    () => [cthEditorTheme, syntaxHighlighting(cthSyntax), ...(filePath ? extensionsFor(filePath) : [])],
    [filePath]
  );

  if (!filePath) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        background: 'var(--cth-paper-200)',
        textAlign: 'center'
      }}>
        <div style={{ opacity: 0.5 }}>
          <Icon name="code" size={2} />
        </div>
        <div style={{
          fontFamily: 'var(--cth-font-display)', fontSize: 12, lineHeight: '18px',
          textTransform: 'none', letterSpacing: 1,
          color: 'var(--cth-ink-700)'
        }}> {uiText("No_file_open_054aea")} </div>
        <div style={{
          fontFamily: 'var(--cth-font-ui)', fontSize: 13,
          color: 'var(--cth-ink-500)'
        }}> {uiText("Pick_a_file_from_the_tree_to_view_it_here_7ac2fa")} </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'var(--cth-paper-100)'
    }}>
      {/* Mini header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 8px',
        background: 'var(--cth-cream-200)',
        borderBottom: '1px solid var(--cth-ink-700)',
        fontFamily: 'var(--cth-font-ui)', fontSize: 12,
        color: 'var(--cth-ink-700)'
      }}>
        <Icon name="code" />
        <span style={{
          flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }} title={absPath}>{filePath}{dirty && ' •'}</span>
        {onCopyPath && (
          <button
            onClick={onCopyPath}
            title={uiText("Copy_absolute_path_b96d42")}
            style={editorBtn}
          >{uiText("copy_path_9a303d")}</button>
        )}
        <button
          onClick={save}
          disabled={!dirty || saveState === 'saving'}
          title={uiText("Save_Cmd_S_f0bb36")}
          style={{ ...editorBtn, opacity: dirty ? 1 : 0.5 }}
        >
          {saveState === 'saving' ? '...' : saveState === 'saved' ? 'saved' : saveState === 'error' ? 'err' : 'save'}
        </button>
        {onOpenInIde && (
          <button
            onClick={onOpenInIde}
            title={uiText("Open_in_the_IDE_6bf5ac")}
            aria-label={uiText("Open_in_the_IDE_6bf5ac")}
            style={editorBtn}
          >
            <Icon name="code" />
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 12, color: 'var(--cth-ink-500)' }}>{uiText("loading_fd3e3d")}</div>
        ) : error ? (
          <div style={{ padding: 12, color: 'var(--cth-coral)' }}>{error}</div>
        ) : (
          <CodeMirror
            value={content}
            onChange={(v) => setContent(v)}
            extensions={extensions}
            height="100%"
            theme="light"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              foldGutter: true,
              autocompletion: false
            }}
          />
        )}
      </div>
    </div>
  );
}

const editorBtn: React.CSSProperties = {
  padding: '0 6px', height: 22,
  fontFamily: 'var(--cth-font-ui)', fontSize: 12,
  color: 'var(--cth-ink-900)',
  background: 'var(--cth-cream-100)',
  border: 'none',
  boxShadow: 'inset 0 0 0 1px var(--cth-ink-100)',
  cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 4
};

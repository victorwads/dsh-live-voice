// @ts-nocheck
import { marked } from 'marked';
import { resolveCodeNotice } from './speechDefaults.js';

// Spoken phrases follow the TTS language, independently of the interface locale.
const phrases = {
  en: [
    'Link to',
    'Image:',
    'Table with columns:',
    'Checked:',
    'Unchecked:',
    'line',
    'lines',
    'to',
    'identifier',
  ],
  pt: [
    'Link para',
    'Imagem:',
    'Tabela com colunas:',
    'Marcado:',
    'Desmarcado:',
    'linha',
    'linhas',
    'a',
    'identificador',
  ],
  es: [
    'Enlace a',
    'Imagen:',
    'Tabla con columnas:',
    'Marcado:',
    'Desmarcado:',
    'línea',
    'líneas',
    'a',
    'identificador',
  ],
  fr: [
    'Lien vers',
    'Image :',
    'Tableau avec les colonnes :',
    'Coché :',
    'Décoché :',
    'ligne',
    'lignes',
    'à',
    'identifiant',
  ],
  hi: [
    'लिंक',
    'चित्र:',
    'तालिका के स्तंभ:',
    'चिह्नित:',
    'अचिह्नित:',
    'पंक्ति',
    'पंक्तियाँ',
    'से',
    'पहचानकर्ता',
  ],
  zh: ['链接到', '图片：', '表格列：', '已勾选：', '未勾选：', '行', '行', '至', '标识符'],
};
export function markdownSpeech(source, options = {}) {
  const p = phrases[String(options.lang || 'en').split('-')[0]] || phrases.en;
  const host = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };
  const plain = (text) =>
    String(text)
      .replace(/https?:\/\/[^\s<>]+/gu, (url) => p[0] + ' ' + host(url))
      .replace(
        /(?:[A-Za-z]:[\\/]|\.{0,2}\/)?(?:[\w.@~-]+[\\/])+([\w.@~-]+\.[\w]+)((?::\d+(?:-\d+)?)|(?:#L\d+(?:-L?\d+)?))?/gu,
        (_, name, loc = '') => name + loc,
      )
      .replace(
        /([\w.@~-]+\.[\w]+)(?::(\d+)(?:-(\d+))?|#L(\d+)(?:-L?(\d+))?)/gu,
        (_, name, a, b, c, d) =>
          name +
          ', ' +
          (b || d ? p[6] : p[5]) +
          ' ' +
          (a || c) +
          (b || d ? ' ' + p[7] + ' ' + (b || d) : ''),
      )
      .replace(
        /\b(?:[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}|[a-f\d]{24,})\b/giu,
        p[8],
      );
  const inline = (tokens = []) =>
    tokens
      .map((t) => {
        if (t.type === 'link') {
          const name = t.text === t.href ? host(t.href) : inline(t.tokens);
          return p[0] + ' ' + (name || host(t.href) || plain(t.href));
        }
        if (t.type === 'image') return t.text ? p[1] + ' ' + plain(t.text) : '';
        if (t.type === 'html') return '';
        if (t.type === 'br') return '\n';
        if (t.tokens) return inline(t.tokens);
        return plain(t.text ?? t.raw ?? '');
      })
      .join('');
  const blocks = (tokens) =>
    tokens
      .map((t) => {
        if (t.type === 'space') return t.raw;
        if (t.type === 'hr' || t.type === 'def' || t.type === 'html') return '';
        if (t.type === 'code')
          return options.filterCodeBlocks !== false &&
            t.text.split(/\r?\n/).length > (options.codeBlockMaxLines ?? 5)
            ? resolveCodeNotice(options.codeBlockNotice, options.lang)
            : t.text;
        if (t.type === 'blockquote') return blocks(t.tokens);
        if (t.type === 'list')
          return t.items
            .map(
              (item, i) =>
                (item.task
                  ? (item.checked ? p[3] : p[4]) + ' '
                  : t.ordered
                    ? Number(t.start) + i + '. '
                    : '') + blocks(item.tokens).trim(),
            )
            .join('\n');
        if (t.type === 'table')
          return (
            p[2] +
            ' ' +
            t.header.map((c) => inline(c.tokens)).join(', ') +
            '\n' +
            t.rows.map((row) => row.map((c) => inline(c.tokens)).join(', ')).join('\n')
          );
        return t.tokens ? inline(t.tokens) : plain(t.text || '');
      })
      .reduce(
        (result, value) =>
          !value
            ? result
            : result +
              (result && !result.endsWith('\n') && !value.startsWith('\n') ? '\n' : '') +
              value,
        '',
      );
  return blocks(marked.lexer(String(source || ''), { gfm: true })).trim();
}
export function hasIncompleteSpeechMarkdown(source) {
  if (/^[ \t]*\|/mu.test(source) || /\]\[[^\]]*\]/u.test(source)) return true;
  return /!?\[[^\]]*$|!?\[[^\]]*\]\([^)]*$|!?\[[^\]]*\]\[[^\]]*\]/u.test(source);
}

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * The small slice of Markdown the assistant is asked to write, rendered as React
 * elements.
 *
 * WHY NOT `react-markdown`. It is 40-plus kB on top of `remark`, and it would be
 * pulled into a bundle that currently ships nothing of the sort, to render bold
 * text, bullets, links and the occasional table. What is here is the subset the
 * system prompt actually asks for and nothing else.
 *
 * WHY NOT `dangerouslySetInnerHTML`. The text comes back from a third-party
 * model, and a model can be talked into emitting anything — including a
 * `<script>` or an `onerror=` attribute. Nothing here ever becomes HTML: every
 * branch returns a React element with the text as a child, so injection is not
 * mitigated, it is impossible.
 *
 * LINKS ARE FILTERED, NOT TRUSTED. A relative path becomes a client-side
 * <Link> (no page reload, and it cannot leave the app); http(s) opens in a new
 * tab with `noopener`; anything else — `javascript:`, `data:` — renders as plain
 * text. A hallucinated internal path is a 404, which the router already handles;
 * a `javascript:` URL would not be.
 */

// Order matters: code first, so `**` inside a code span is left alone.
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\[[^\]\n]*\]\([^)\s]+\))|(\*[^*\n]+\*)|(__[^_\n]+__)/g;

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

const renderLink = (label, href, key) => {
  if (href.startsWith('/')) {
    return (
      <Link key={key} to={href} className="font-semibold text-brand-text underline decoration-brand/40 underline-offset-2 hover:decoration-brand">
        {label}
      </Link>
    );
  }
  if (SAFE_URL.test(href)) {
    return (
      <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-text underline decoration-brand/40 underline-offset-2 hover:decoration-brand">
        {label}
      </a>
    );
  }
  // Unknown scheme — show the words, drop the link.
  return <span key={key}>{label}</span>;
};

/** Bold, italic, inline code and links inside one line of text. */
const inline = (text, keyPrefix = 'i') => {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let match;
  let n = 0;

  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${n++}`;

    if (token.startsWith('`')) {
      nodes.push(<code key={key} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.9em] text-primary">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={key} className="font-bold text-primary">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('__')) {
      nodes.push(<strong key={key} className="font-bold text-primary">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('[')) {
      const split = token.indexOf('](');
      nodes.push(renderLink(token.slice(1, split), token.slice(split + 2, -1), key));
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
};

const isBullet = (line) => /^\s*[-*•]\s+/.test(line);
const isNumbered = (line) => /^\s*\d+[.)]\s+/.test(line);
const isHeading = (line) => /^#{1,6}\s+/.test(line);
const isTableRow = (line) => line.trim().startsWith('|') && line.trim().endsWith('|');
const isTableRule = (line) => /^\s*\|[\s:|-]+\|\s*$/.test(line);

const cells = (line) => line.trim().slice(1, -1).split('|').map((c) => c.trim());

/**
 * Group lines into blocks, then render each.
 *
 * A line-at-a-time loop rather than a parser: the input is a few hundred words
 * of chat, the grammar is six constructs, and a proper AST would be more code
 * than the thing it parses.
 */
const AssistantMarkdown = ({ text = '' }) => {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i += 1; continue; }

    // Fenced code — rare from this assistant, but a stray fence should not eat
    // the rest of the reply as body text.
    if (line.trim().startsWith('```')) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { body.push(lines[i]); i += 1; }
      i += 1;
      blocks.push(
        <pre key={key++} className="overflow-x-auto rounded-xl bg-surface-2 p-3 font-mono text-xs text-primary">
          {body.join('\n')}
        </pre>,
      );
      continue;
    }

    if (isHeading(line)) {
      const level = (line.match(/^#+/) || ['#'])[0].length;
      const content = line.replace(/^#{1,6}\s+/, '');
      blocks.push(
        <p key={key++} className={level <= 2
          ? 'mt-1 font-display text-sm font-bold uppercase tracking-wide text-primary'
          : 'mt-1 text-[13px] font-bold text-primary'}>
          {inline(content, `h${key}`)}
        </p>,
      );
      i += 1;
      continue;
    }

    // Tables: a header row, a separator, then rows. Rendered scrollable — a
    // standings table with eight columns must not widen the chat panel.
    if (isTableRow(line) && isTableRule(lines[i + 1] || '')) {
      const header = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) { rows.push(cells(lines[i])); i += 1; }

      blocks.push(
        <div key={key++} className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-hairline">
                {header.map((h, c) => (
                  <th key={c} className="px-2 py-1.5 text-left font-bold uppercase tracking-wide text-tertiary">{inline(h, `th${c}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r} className="border-b border-hairline/60 last:border-0">
                  {row.map((cell, c) => (
                    <td key={c} className="px-2 py-1.5 tabular-nums text-secondary">{inline(cell, `td${r}-${c}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (isBullet(line) || isNumbered(line)) {
      const ordered = isNumbered(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? isNumbered(lines[i]) : isBullet(lines[i]))) {
        items.push(lines[i].replace(ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*•]\s+/, ''));
        i += 1;
      }

      const ListTag: any = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag key={key++} className={ordered ? 'ml-4 list-decimal space-y-1' : 'ml-1 space-y-1'}>
          {items.map((item, n) => (
            <li key={n} className={ordered ? 'pl-1' : 'relative pl-4 before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-brand'}>
              {inline(item, `li${key}-${n}`)}
            </li>
          ))}
        </ListTag>,
      );
      continue;
    }

    // A paragraph runs until a blank line or the start of another construct.
    const paragraph: string[] = [];
    while (
      i < lines.length && lines[i].trim() &&
      !isBullet(lines[i]) && !isNumbered(lines[i]) && !isHeading(lines[i]) &&
      !isTableRow(lines[i]) && !lines[i].trim().startsWith('```')
    ) {
      paragraph.push(lines[i]);
      i += 1;
    }
    blocks.push(<p key={key++}>{inline(paragraph.join(' '), `p${key}`)}</p>);
  }

  return <div className="space-y-2 leading-relaxed">{blocks}</div>;
};

export default AssistantMarkdown;

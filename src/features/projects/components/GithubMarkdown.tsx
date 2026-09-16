import type { ReactNode } from "react";

type GithubMarkdownProps = {
  markdown: string;
};

function safeHref(value: string): string | null {
  const href = value.trim();
  if (!href) return null;

  try {
    const parsed = new URL(href);
    if (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:" ||
      parsed.protocol === "mailto:"
    ) {
      return href;
    }
  } catch {
    return null;
  }

  return null;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(`[^`\n]+`|\*\*[^*\n]+\*\*|~~[^~\n]+~~|\*[^*\n]+\*|\[[^\]\n]+\]\([^) \n]+\))/g;

  let cursor = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] font-semibold text-slate-700"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-bold text-slate-800">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("~~")) {
      nodes.push(
        <del key={key} className="text-slate-500">
          {token.slice(2, -2)}
        </del>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link ? safeHref(link[2]) : null;
      if (link && href) {
        nodes.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="font-semibold text-violet-700 underline decoration-violet-200 underline-offset-2 hover:text-violet-800"
          >
            {link[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }

    cursor = pattern.lastIndex;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function isTableDivider(line: string) {
  const cells = line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function tableCells(line: string) {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isBlockStart(lines: string[], index: number) {
  const line = lines[index] ?? "";
  if (!line.trim()) return true;
  if (/^```/.test(line.trim())) return true;
  if (/^#{1,6}\s+/.test(line)) return true;
  if (/^>\s?/.test(line)) return true;
  if (/^\s*[-*+]\s+/.test(line)) return true;
  if (/^\s*\d+\.\s+/.test(line)) return true;
  if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) return true;
  if (line.includes("|") && isTableDivider(lines[index + 1] ?? "")) return true;
  return false;
}

export function GithubMarkdown({ markdown }: GithubMarkdownProps) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let keyIndex = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;

      blocks.push(
        <div
          key={`code-${keyIndex++}`}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950"
        >
          {language ? (
            <div className="border-b border-slate-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {language}
            </div>
          ) : null}
          <pre className="overflow-x-auto p-4 text-xs leading-6 text-slate-100">
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const classes =
        level <= 2
          ? "text-base font-black text-slate-900"
          : "text-sm font-extrabold text-slate-800";
      blocks.push(
        <div key={`heading-${keyIndex++}`} className={level <= 2 ? "pt-1" : ""}>
          <div className={classes}>
            {renderInline(heading[2].trim(), `heading-${keyIndex}`)}
          </div>
          {level <= 2 ? <div className="mt-2 h-px bg-slate-100" /> : null}
        </div>,
      );
      index += 1;
      continue;
    }

    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      blocks.push(<hr key={`hr-${keyIndex++}`} className="border-slate-200" />);
      index += 1;
      continue;
    }

    if (line.includes("|") && isTableDivider(lines[index + 1] ?? "")) {
      const headers = tableCells(line);
      index += 2;
      const rows: string[][] = [];
      while (
        index < lines.length &&
        lines[index].includes("|") &&
        lines[index].trim()
      ) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }

      blocks.push(
        <div
          key={`table-${keyIndex++}`}
          className="overflow-x-auto rounded-xl border border-slate-200"
        >
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50">
              <tr>
                {headers.map((cell, cellIndex) => (
                  <th
                    key={cellIndex}
                    className="px-3 py-2 font-bold text-slate-700"
                  >
                    {renderInline(cell, `th-${keyIndex}-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((_, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-3 py-2 align-top text-slate-600"
                    >
                      {renderInline(
                        row[cellIndex] ?? "",
                        `td-${keyIndex}-${rowIndex}-${cellIndex}`,
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote
          key={`quote-${keyIndex++}`}
          className="border-l-4 border-violet-200 bg-violet-50/50 px-4 py-3 text-sm leading-6 text-slate-600"
        >
          {quoteLines.map((quoteLine, quoteIndex) => (
            <p key={quoteIndex}>
              {renderInline(quoteLine, `quote-${keyIndex}-${quoteIndex}`)}
            </p>
          ))}
        </blockquote>,
      );
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: Array<{ text: string; checked: boolean | null }> = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        let item = lines[index].replace(/^\s*[-*+]\s+/, "");
        const task = item.match(/^\[([ xX])\]\s+(.*)$/);
        if (task) {
          items.push({ text: task[2], checked: task[1].toLowerCase() === "x" });
        } else {
          items.push({ text: item, checked: null });
        }
        index += 1;
      }

      blocks.push(
        <ul
          key={`ul-${keyIndex++}`}
          className="space-y-1.5 pl-5 text-sm leading-6 text-slate-600"
        >
          {items.map((item, itemIndex) => (
            <li
              key={itemIndex}
              className={item.checked !== null ? "list-none" : "list-disc pl-1"}
            >
              {item.checked !== null ? (
                <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded border border-slate-300 align-[-2px] text-[10px] font-black text-violet-600">
                  {item.checked ? "✓" : ""}
                </span>
              ) : null}
              {renderInline(item.text, `li-${keyIndex}-${itemIndex}`)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
        index += 1;
      }

      blocks.push(
        <ol
          key={`ol-${keyIndex++}`}
          className="list-decimal space-y-1.5 pl-6 text-sm leading-6 text-slate-600"
        >
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="pl-1">
              {renderInline(item, `oli-${keyIndex}-${itemIndex}`)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;
    while (index < lines.length && !isBlockStart(lines, index)) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push(
      <p key={`p-${keyIndex++}`} className="text-sm leading-7 text-slate-600">
        {renderInline(paragraphLines.join(" "), `p-${keyIndex}`)}
      </p>,
    );
  }

  return <div className="space-y-4 break-words">{blocks}</div>;
}

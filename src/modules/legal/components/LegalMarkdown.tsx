import { ITChip, ITDivider, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { ReactNode } from "react";
import { LEGAL_VALUES } from "../legal.config";

/** Pinta `[[CAMPO]]`: el valor configurado, o una marca "pendiente" para que no pase como texto final. */
const placeholder = (raw: string, key: string): ReactNode => {
  const name = raw.split(/\s+[—-]\s+|\s+(?=VALIDAR)/)[0].trim();
  const value = LEGAL_VALUES[name];
  if (value) return <ITText as="strong" key={key}>{value}</ITText>;
  return <ITChip key={key} label={`Pendiente: ${raw}`} color="warning" size="sm" />;
};

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|\[\[[^\]]+\]\])/g;

/** Texto en línea: **negritas**, *cursivas*, `código` y [[campos]], también anidados dentro de negritas/código. */
const inline = (text: string, base = "i"): ReactNode[] =>
  text.split(INLINE).filter(Boolean).map((part, i) => {
    const key = `${base}-${i}`;
    if (part.startsWith("[[")) return placeholder(part.slice(2, -2), key);
    if (part.startsWith("**")) return <ITText as="strong" key={key}>{inline(part.slice(2, -2), key)}</ITText>;
    if (part.startsWith("`")) return <ITText as="span" key={key}>{inline(part.slice(1, -1), key)}</ITText>;
    if (part.startsWith("*")) return <ITText as="em" key={key}>{inline(part.slice(1, -1), key)}</ITText>;
    return part;
  });

type Block =
  | { t: "h"; level: 1 | 2 | 3; text: string }
  | { t: "p"; text: string }
  | { t: "quote"; text: string }
  | { t: "list"; ordered: boolean; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "hr" };

const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export const parseMarkdown = (source: string): Block[] => {
  const lines = source.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if (h) { blocks.push({ t: "h", level: h[1].length as 1 | 2 | 3, text: h[2] }); i++; continue; }
    if (/^-{3,}$/.test(line.trim())) { blocks.push({ t: "hr" }); i++; continue; }
    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ t: "quote", text: buf.join(" ") });
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) rows.push(cells(lines[i++]));
      blocks.push({ t: "table", head: rows[0], rows: rows.slice(2) });
      continue;
    }
    const li = line.match(/^(-|\d+\.)\s+/);
    if (li) {
      const ordered = li[1] !== "-";
      const items: string[] = [];
      while (i < lines.length && /^(-|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^(-|\d+\.)\s+/, ""));
      blocks.push({ t: "list", ordered, items });
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#|>|\||-{3,}|(-|\d+\.)\s)/.test(lines[i])) buf.push(lines[i++]);
    blocks.push({ t: "p", text: buf.join(" ") });
  }
  return blocks;
};

const HEADING_CLASS = {
  1: "text-2xl font-bold! text-slate-900!",
  2: "text-lg font-semibold! text-slate-900! mt-4",
  3: "text-base font-semibold! text-slate-800! mt-2",
} as const;

export const LegalMarkdown = ({ source }: { source: string }) => (
  <ITFlex direction="column" gap={3}>
    {parseMarkdown(source).map((b, n) => {
      const key = `b-${n}`;
      switch (b.t) {
        case "h":
          return <ITText key={key} as={`h${b.level + 1}` as "h2"} className={HEADING_CLASS[b.level]}>{inline(b.text)}</ITText>;
        case "p":
          return <ITText key={key} as="p" className="text-sm leading-relaxed text-slate-700!">{inline(b.text)}</ITText>;
        case "quote":
          return (
            <ITFlex key={key} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <ITText as="p" className="text-sm text-amber-900!">{inline(b.text)}</ITText>
            </ITFlex>
          );
        case "list":
          return (
            <ITText key={key} as={b.ordered ? "ol" : "ul"} className={`${b.ordered ? "list-decimal" : "list-disc"} pl-5 text-sm text-slate-700! flex flex-col gap-1`}>
              {b.items.map((it, j) => <ITText key={`${key}-${j}`} as="li">{inline(it, `${key}-${j}`)}</ITText>)}
            </ITText>
          );
        case "table":
          return (
            <ITFlex key={key} className="overflow-x-auto rounded-lg border border-slate-200">
              <ITText as="table" className="w-full text-left text-sm">
                <ITText as="thead" className="bg-slate-50">
                  <ITText as="tr">
                    {b.head.map((c, j) => <ITText key={j} as="th" className="p-2 font-semibold! text-slate-800!">{inline(c, `${key}-h${j}`)}</ITText>)}
                  </ITText>
                </ITText>
                <ITText as="tbody">
                  {b.rows.map((r, j) => (
                    <ITText key={j} as="tr" className="border-t border-slate-100">
                      {r.map((c, k) => <ITText key={k} as="td" className="p-2 align-top text-slate-700!">{inline(c, `${key}-${j}-${k}`)}</ITText>)}
                    </ITText>
                  ))}
                </ITText>
              </ITText>
            </ITFlex>
          );
        case "hr":
          return <ITDivider key={key} />;
      }
    })}
  </ITFlex>
);

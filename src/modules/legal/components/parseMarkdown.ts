export type Block =
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

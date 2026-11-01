export type AnswerPart = { type: "text"; text: string } | { type: "citation"; id: string };

/** Split answer text on [E901] and [P901] citations, keeping everything else unchanged. */
export function parseAnswer(answer: string): AnswerPart[] {
  const parts: AnswerPart[] = [];
  let last = 0;
  for (const match of answer.matchAll(/\[([EP]\d{3})\]/g)) {
    if (match.index > last) parts.push({ type: "text", text: answer.slice(last, match.index) });
    parts.push({ type: "citation", id: match[1] });
    last = match.index + match[0].length;
  }
  if (last < answer.length) parts.push({ type: "text", text: answer.slice(last) });
  return parts;
}

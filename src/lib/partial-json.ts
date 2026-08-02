/**
 * Tolerant parser for a JSON object that is still being streamed.
 * Closes any open string, array, or object so the partially received text can
 * be parsed and rendered progressively. Returns null when nothing usable yet.
 */
export function parsePartialJson<T = unknown>(raw: string): T | null {
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  if (!text.startsWith("{")) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    // fall through to repair
  }

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const ch of text) {
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }

  let candidate = text;
  if (escaped) candidate = candidate.slice(0, -1);
  if (inString) candidate += '"';

  // Drop a dangling key/comma so the repaired text stays valid.
  candidate = candidate.replace(/,\s*$/, "").replace(/(\{|,)\s*"[^"]*"\s*:?\s*$/, "$1");
  candidate = candidate.replace(/(\{|\[)\s*,/g, "$1").replace(/,\s*$/, "");

  for (let i = stack.length - 1; i >= 0; i--) {
    candidate += stack[i] === "{" ? "}" : "]";
  }

  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}

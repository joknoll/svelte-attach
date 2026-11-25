export type TokenType =
  | "keyword"
  | "string"
  | "number"
  | "function"
  | "property"
  | "tag"
  | "punctuation";

export interface Token {
  type?: TokenType;
  text: string;
}

// Match `{@attach` before `{` and keep `=>` together so `>` isn't treated as a tag end.
const TOKEN =
  /(?<string>"[^"]*"|'[^']*')|(?<number>\b\d+(?:\.\d+)?\b)|(?<tag><\/?[a-z][\w-]*|\/?>)|(?<keyword>\{@attach\b|\b(?:import|from|const|new|true|false)\b)|(?<function>\b[A-Za-z_$][\w$]*(?=\())|(?<property>\b[A-Za-z_$][\w$]*(?=:))|(?<punctuation>=>|&&|[{}()[\],;:?.=$])/g;

/** Splits a snippet into tokens; text between matches comes back without a type. */
export function highlight(code: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of code.matchAll(TOKEN)) {
    if (match.index > last) tokens.push({ text: code.slice(last, match.index) });
    const [type] = Object.entries(match.groups ?? {}).find(([, text]) => text !== undefined) ?? [];
    tokens.push({ type: type as TokenType, text: match[0] });
    last = match.index + match[0].length;
  }
  if (last < code.length) tokens.push({ text: code.slice(last) });
  return tokens;
}

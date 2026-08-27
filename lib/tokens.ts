/** Approximate token count for budget checks (chars/4). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

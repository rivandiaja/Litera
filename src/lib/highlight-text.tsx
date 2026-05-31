import type { ReactNode } from "react";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createHighlightedSegments(text: string, matchedTerms: string[]) {
  const normalizedTerms = matchedTerms
    .map((term) => term.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (!text || normalizedTerms.length === 0) {
    return [{ text, highlighted: false }];
  }

  const pattern = normalizedTerms.map(escapeRegExp).join("|");
  const regex = new RegExp(`(${pattern})`, "gi");
  const segments: { text: string; highlighted: boolean }[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const matchText = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, index), highlighted: false });
    }
    segments.push({ text: matchText, highlighted: true });
    lastIndex = index + matchText.length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlighted: false });
  }

  return segments.length ? segments : [{ text, highlighted: false }];
}

export function highlightText(text: string, matchedTerms: string[]): ReactNode[] {
  return createHighlightedSegments(text, matchedTerms).map((segment, index) => (
    segment.highlighted ? (
      <mark key={`${segment.text}-${index}`} className="bg-amber-200/80 text-amber-900 px-0.5 rounded-[3px] font-semibold not-italic">
        {segment.text}
      </mark>
    ) : (
      <span key={`${segment.text}-${index}`}>{segment.text}</span>
    )
  ));
}

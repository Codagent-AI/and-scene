// Presentation-owned type size: after the 390px browse fit this is ~11.9px.
// The canvas and entity coordinates stay unchanged; only their local copy differs.
export const COMPACT_FONT_SIZE = 32
export const compactCopy: Record<string, { label: string; detail?: string }> = {
  you: { label: 'you' },
  prompt: { label: 'topic' },
  skill: { label: 'skill' },
  question: { label: 'Q & A' },
  'card-1': { label: '01', detail: 'T C V' },
  'card-2': { label: '02', detail: 'T C V' },
  'card-3': { label: '03', detail: 'T C V' },
  'link-1': { label: '→' },
  'link-2': { label: '→' },
  depth: { label: 'P ↔ F' },
  ghost: { label: '…', detail: 'more' },
  kit: { label: 'scene kit' },
  pipeline: { label: '→' },
  verify: { label: 'check', detail: '✓ ✓' },
  edited: { label: '✎' },
  reveal: { label: 'this is one' },
}

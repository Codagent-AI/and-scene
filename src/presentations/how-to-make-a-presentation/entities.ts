export interface Entity { id: string; kind: 'box' | 'label' | 'arrow' | 'frame' | 'chip'; x: number; y: number; w: number; h: number; text?: string; description?: string; parts?: string[]; bidirectional?: boolean; path?: string; treatment?: string }
const e = (id: string, kind: Entity['kind'], x: number, y: number, w: number, h: number, text?: string, extra: Partial<Entity> = {}): Entity => ({ id: `how-to:${id}`, kind, x, y, w, h, text, ...extra })
// One fixed composition for every viewport. At 320px wide, 38px type still
// displays above 12px after the kit's uniform fit. Full narration stays in captions.
export const additions: readonly Entity[][] = [
  [e('you', 'box', 24, 48, 144, 60, 'you'), e('prompt', 'chip', 24, 4, 158, 42, 'topic', { description: 'A topic, an idea' })],
  [e('skill', 'box', 566, 48, 168, 60, 'the skill'), e('conversation', 'arrow', 190, 66, 348, 24, undefined, { bidirectional: true }), e('question', 'chip', 280, 4, 166, 42, 'Q&A', { description: 'One question at a time' })],
  [e('tray', 'label', 264, 110, 280, 44, 'STEPS', { description: 'The story, built together' }), e('card-1', 'box', 24, 158, 144, 176, '1', { parts: ['title', 'caption', 'visual'] })],
  [e('card-2', 'box', 232, 158, 144, 176, '2', { parts: ['title', 'caption', 'visual'] }), e('card-3', 'box', 440, 158, 144, 176, '3', { parts: ['title', 'caption', 'visual'] }), e('link-1', 'arrow', 172, 234, 56, 24), e('morph-1', 'label', 170, 176, 60, 44, '↔', { description: 'Morph: the same shapes move between steps' }), e('link-2', 'arrow', 380, 234, 56, 24), e('morph-2', 'label', 378, 176, 60, 44, '↔', { description: 'Morph: the same shapes move between steps' })],
  [e('ghost', 'box', 608, 158, 104, 176, '…', { parts: ['next'], treatment: 'ghost', description: 'Unspecified next beats' }), e('depth', 'chip', 24, 110, 224, 44, 'partial ↔ full', { description: 'You choose partial or full detail' })],
  [e('socket', 'chip', 232, 334, 300, 42, 'shared scene kit', { description: 'Shared scene kit: boxes, arrows, and motion' })],
  [e('verify', 'box', 740, 158, 128, 176, '✓', { parts: ['build', 'render'], treatment: 'pass', description: 'Build and render checks passed' }), e('verify-link', 'arrow', 716, 234, 20, 24)],
  [e('modify', 'arrow', 448, 108, 194, 50, undefined, { path: 'M100 0 C100 12 10 8 10 20 L14 17 M10 20 L6 17' }), e('modify-label', 'label', 646, 112, 216, 44, 'edit in place', { description: 'Ask for a change: edit an existing card in place' }), e('edited', 'chip', 498, 158, 80, 42, 'edit', { treatment: 'edited', description: 'Edited step' })],
  [e('reveal', 'frame', 12, 0, 866, 380), e('reveal-label', 'chip', 548, 336, 320, 42, 'this presentation', { treatment: 'reveal', description: 'This presentation is the proof: you are looking at one' })],
]
export function entitiesAt(beat: number): Entity[] { return additions.slice(0, beat + 1).flat() }

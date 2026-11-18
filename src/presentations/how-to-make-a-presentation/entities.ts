export interface Entity { id: string; kind: 'box' | 'label' | 'arrow' | 'frame' | 'chip'; x: number; y: number; w: number; h: number; text?: string; parts?: string[]; bidirectional?: boolean; path?: string; treatment?: string }
const e = (id: string, kind: Entity['kind'], x: number, y: number, w: number, h: number, text?: string, extra: Partial<Entity> = {}): Entity => ({ id: `how-to:${id}`, kind, x, y, w, h, text, ...extra })
export const additions: readonly Entity[][] = [
  [e('you', 'box', 54, 58, 112, 68, 'you'), e('prompt', 'chip', 48, 14, 158, 30, 'a topic, an idea…')],
  [e('skill', 'box', 566, 58, 152, 68, 'the skill'), e('conversation', 'arrow', 190, 78, 348, 24, undefined, { bidirectional: true }), e('question', 'chip', 280, 36, 166, 28, 'one question at a time')],
  [e('tray', 'label', 54, 158, 700, 24, 'THE STORY / built together'), e('card-1', 'box', 54, 196, 142, 88, '01 / the opening', { parts: ['title', 'caption', 'visual'] })],
  [e('card-2', 'box', 246, 196, 142, 88, '02 / the idea', { parts: ['title', 'caption', 'visual'] }), e('card-3', 'box', 438, 196, 142, 88, '03 / the payoff', { parts: ['title', 'caption', 'visual'] }), e('link-1', 'arrow', 200, 233, 42, 18), e('morph-1', 'label', 198, 210, 46, 18, 'morph'), e('link-2', 'arrow', 392, 233, 42, 18), e('morph-2', 'label', 390, 210, 46, 18, 'morph')],
  [e('ghost', 'box', 630, 196, 124, 88, '… your next beat', { treatment: 'ghost' }), e('depth', 'chip', 54, 130, 168, 22, 'partial ↔ full / your call')],
  [e('socket', 'chip', 246, 284, 244, 34, 'shared scene kit / shapes + motion')],
  [e('verify', 'box', 786, 196, 78, 88, '✓', { parts: ['build + render', 'pass'], treatment: 'pass' }), e('verify-link', 'arrow', 756, 234, 28, 18)],
  [e('modify', 'arrow', 578, 128, 280, 68, undefined, { path: 'M2 0 C2 15 76 5 76 20 L72 17 M76 20 L80 17' }), e('modify-label', 'label', 622, 134, 230, 24, 'ask for a change / edit in place'), e('edited', 'chip', 464, 174, 90, 19, 'edited', { treatment: 'edited' })],
  [e('reveal', 'frame', 28, 2, 850, 356), e('reveal-label', 'chip', 530, 326, 312, 25, 'THIS PRESENTATION IS THE PROOF', { treatment: 'reveal' })],
]
export function entitiesAt(beat: number): Entity[] { return additions.slice(0, beat + 1).flat() }

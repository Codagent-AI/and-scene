/** Positions are immutable: this example grows by addition, never rearrangement. */
export const entities = [
  { id: 'you', from: 1, x: 62, y: 54, w: 100, h: 58, kind: 'person', text: 'you' },
  { id: 'prompt', from: 1, x: 62, y: 18, w: 180, h: 28, kind: 'prompt', text: '“I have a topic…”' },
  { id: 'skill', from: 2, x: 424, y: 54, w: 126, h: 58, kind: 'skill', text: 'the skill' },
  { id: 'conversation', from: 2, x: 178, y: 73, w: 230, h: 24, kind: 'connection', text: '⟷' },
  { id: 'question', from: 2, x: 248, y: 30, w: 140, h: 27, kind: 'chip', text: 'one question at a time' },
  { id: 'tray', from: 3, x: 52, y: 173, w: 768, h: 112, kind: 'tray', text: '' },
  { id: 'card-1', from: 3, x: 72, y: 185, w: 128, h: 86, kind: 'card', text: '01 / the opening' },
  { id: 'link-1', from: 4, x: 204, y: 210, w: 65, h: 30, kind: 'link', text: 'morph →' },
  { id: 'card-2', from: 4, x: 274, y: 185, w: 128, h: 86, kind: 'card', text: '02 / the next beat' },
  { id: 'link-2', from: 4, x: 406, y: 210, w: 65, h: 30, kind: 'link', text: 'morph →' },
  { id: 'card-3', from: 4, x: 476, y: 185, w: 128, h: 86, kind: 'card', text: '03 / the payoff' },
  { id: 'ghost', from: 5, x: 619, y: 185, w: 52, h: 86, kind: 'ghost', text: '…' },
  { id: 'depth', from: 5, x: 62, y: 112, w: 150, h: 30, kind: 'depth', text: 'partial ⟷ full' },
  { id: 'kit', from: 6, x: 290, y: 285, w: 280, h: 42, kind: 'socket', text: 'shared scene kit · boxes / arrows / motion' },
  { id: 'verify-link', from: 7, x: 675, y: 213, w: 26, h: 24, kind: 'link', text: '→' },
  { id: 'verify', from: 7, x: 706, y: 185, w: 96, h: 86, kind: 'verify', text: '✓ verify' },
  { id: 'modify', from: 8, x: 561, y: 75, w: 194, h: 94, kind: 'modify', text: '↳ ask → edit in place' },
  { id: 'edited', from: 8, x: 334, y: 159, w: 68, h: 23, kind: 'flag', text: 'edited ↙' },
  { id: 'reveal', from: 9, x: 23, y: 4, w: 826, h: 350, kind: 'reveal', text: 'THIS IS THE OUTPUT. YOU’RE ALREADY IN IT.' },
] as const
export const visibleEntities = (beat: number) => entities.filter(entity => entity.from <= beat)
export const entityId = (id: string) => `how-to-make-a-presentation:${id}`

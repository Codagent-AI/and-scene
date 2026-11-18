export interface Entity { id: string; kind: string; x: number; y: number; w: number; h: number; text: string; from: number }
export const entities: readonly Entity[] = [
  { id: 'you', kind: 'person', x: 75, y: 45, w: 115, h: 65, text: 'you', from: 0 },
  { id: 'prompt', kind: 'bubble', x: 225, y: 50, w: 190, h: 54, text: 'I have a topic…', from: 0 },
  { id: 'skill', kind: 'skill', x: 545, y: 45, w: 145, h: 65, text: 'skill', from: 1 },
  { id: 'conversation', kind: 'connection', x: 430, y: 65, w: 90, h: 25, text: '↔', from: 1 },
  { id: 'question', kind: 'chip', x: 435, y: 15, w: 200, h: 23, text: 'one question at a time', from: 1 },
  { id: 'tray', kind: 'tray', x: 55, y: 145, w: 770, h: 140, text: '', from: 2 },
  { id: 'card-1', kind: 'card', x: 75, y: 185, w: 120, h: 80, text: '01 / the idea', from: 2 },
  { id: 'card-2', kind: 'card', x: 240, y: 185, w: 120, h: 80, text: '02 / the story', from: 3 },
  { id: 'card-3', kind: 'card', x: 405, y: 185, w: 120, h: 80, text: '03 / the scene', from: 3 },
  { id: 'morph-1', kind: 'morph', x: 198, y: 198, w: 40, h: 40, text: 'morph', from: 3 },
  { id: 'morph-2', kind: 'morph', x: 363, y: 198, w: 40, h: 40, text: 'morph', from: 3 },
  { id: 'ghost', kind: 'ghost', x: 570, y: 185, w: 95, h: 80, text: '… your call', from: 4 },
  { id: 'depth', kind: 'depth', x: 63, y: 115, w: 145, h: 22, text: 'partial ↔ full', from: 4 },
  { id: 'scene-kit', kind: 'socket', x: 285, y: 285, w: 310, h: 42, text: 'shared scene kit / boxes · arrows · motion', from: 5 },
  { id: 'verify', kind: 'verify', x: 700, y: 185, w: 105, h: 80, text: '✓ verify', from: 6 },
  { id: 'pipeline', kind: 'connection', x: 668, y: 212, w: 28, h: 24, text: '→', from: 6 },
  { id: 'modify', kind: 'modify', x: 520, y: 110, w: 260, h: 65, text: '↙ modify in place', from: 7 },
  { id: 'edited', kind: 'flag', x: 420, y: 156, w: 100, h: 21, text: '↳ edited', from: 7 },
  { id: 'reveal', kind: 'reveal', x: 12, y: 0, w: 856, h: 365, text: 'THIS IS ONE OF THOSE PRESENTATIONS', from: 8 },
]
export const entitiesAt = (beat: number) => entities.filter(e => e.from <= beat)
export const entityId = (id: string) => `how-to-make-a-presentation:${id}`

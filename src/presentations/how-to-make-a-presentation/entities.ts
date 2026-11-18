export interface Entity { id: string; kind: string; x: number; y: number; w: number; h: number; text: string; from: number }
export const entities: readonly Entity[] = [
  { id: 'you', kind: 'person', x: 75, y: 45, w: 115, h: 65, text: 'you', from: 0 },
  { id: 'prompt', kind: 'bubble', x: 225, y: 50, w: 190, h: 54, text: 'A topic…', from: 0 },
  { id: 'skill', kind: 'skill', x: 545, y: 45, w: 145, h: 65, text: 'skill', from: 1 },
  { id: 'conversation', kind: 'connection', x: 430, y: 65, w: 90, h: 25, text: '↔', from: 1 },
  { id: 'question', kind: 'chip', x: 435, y: 4, w: 260, h: 34, text: 'One question', from: 1 },
  { id: 'tray', kind: 'tray', x: 55, y: 145, w: 770, h: 167, text: '', from: 2 },
  { id: 'card-1', kind: 'card', x: 65, y: 155, w: 120, h: 150, text: 'Idea', from: 2 },
  { id: 'card-2', kind: 'card', x: 275, y: 155, w: 120, h: 150, text: 'Story', from: 3 },
  { id: 'card-3', kind: 'card', x: 485, y: 155, w: 120, h: 150, text: 'Scene', from: 3 },
  { id: 'morph-1', kind: 'morph', x: 186, y: 200, w: 88, h: 68, text: 'morph', from: 3 },
  { id: 'morph-2', kind: 'morph', x: 396, y: 200, w: 88, h: 68, text: 'morph', from: 3 },
  { id: 'ghost', kind: 'ghost', x: 625, y: 155, w: 70, h: 150, text: '…', from: 4 },
  { id: 'depth', kind: 'depth', x: 63, y: 112, w: 340, h: 30, text: 'partial ↔ full', from: 4 },
  { id: 'scene-kit', kind: 'socket', x: 515, y: 312, w: 310, h: 40, text: 'Shared scene kit', from: 5 },
  { id: 'verify', kind: 'verify', x: 715, y: 155, w: 100, h: 150, text: '✓ verify', from: 6 },
  { id: 'pipeline', kind: 'connection', x: 695, y: 212, w: 20, h: 24, text: '→', from: 6 },
  { id: 'modify', kind: 'modify', x: 605, y: 110, w: 220, h: 40, text: 'modify', from: 7 },
  { id: 'edited', kind: 'flag', x: 485, y: 116, w: 120, h: 30, text: 'edited', from: 7 },
  { id: 'reveal', kind: 'reveal', x: 12, y: 0, w: 856, h: 380, text: 'THIS PRESENTATION', from: 8 },
]
export const entitiesAt = (beat: number) => entities.filter(e => e.from <= beat)
export const entityId = (id: string) => `how-to-make-a-presentation:${id}`

export interface SceneRect { x: number; y: number; w: number; h: number }
export interface Entity extends SceneRect { id: string; kind: string; text: string; from: number; labelRect?: SceneRect }
export const entities: readonly Entity[] = [
  { id: 'you', kind: 'person', x: 75, y: 45, w: 115, h: 65, text: 'you', from: 0 },
  { id: 'prompt', kind: 'bubble', x: 225, y: 50, w: 190, h: 54, text: 'A topic…', from: 0 },
  { id: 'skill', kind: 'skill', x: 545, y: 45, w: 145, h: 65, text: 'skill', from: 1 },
  { id: 'conversation', kind: 'connection', x: 430, y: 65, w: 90, h: 25, text: '↔', from: 1 },
  { id: 'question', kind: 'chip', x: 435, y: 4, w: 260, h: 34, text: 'One question', from: 1 },
  { id: 'tray', kind: 'tray', x: 55, y: 145, w: 770, h: 191, text: '', from: 2 },
  { id: 'card-1', kind: 'card', x: 65, y: 155, w: 150, h: 150, text: 'Idea', from: 2 },
  { id: 'card-2', kind: 'card', x: 240, y: 155, w: 150, h: 150, text: 'Story', from: 3 },
  { id: 'card-3', kind: 'card', x: 415, y: 155, w: 150, h: 150, text: 'Scene', from: 3 },
  { id: 'morph-1', kind: 'morph', x: 216, y: 220, w: 23, h: 134, text: 'morph', from: 3, labelRect: { x: 177.5, y: 316, w: 100, h: 38 } },
  { id: 'morph-2', kind: 'morph', x: 391, y: 220, w: 23, h: 134, text: 'morph', from: 3, labelRect: { x: 352.5, y: 316, w: 100, h: 38 } },
  { id: 'ghost', kind: 'ghost', x: 590, y: 155, w: 70, h: 150, text: '…', from: 4 },
  { id: 'depth', kind: 'depth', x: 63, y: 112, w: 340, h: 30, text: 'partial ↔ full', from: 4 },
  { id: 'scene-kit', kind: 'socket', x: 515, y: 336, w: 310, h: 40, text: 'Shared scene kit', from: 5 },
  { id: 'verify', kind: 'verify', x: 685, y: 155, w: 130, h: 150, text: '✓ verify', from: 6 },
  { id: 'pipeline', kind: 'connection', x: 660, y: 212, w: 25, h: 24, text: '→', from: 6 },
  { id: 'modify', kind: 'modify', x: 550, y: 110, w: 275, h: 40, text: 'modify', from: 7 },
  { id: 'edited', kind: 'flag', x: 430, y: 110, w: 120, h: 30, text: 'edited', from: 7 },
  { id: 'reveal', kind: 'reveal', x: 12, y: 0, w: 856, h: 380, text: 'THIS PRESENTATION', from: 8 },
]
export const entitiesAt = (beat: number) => entities.filter(e => e.from <= beat)
export const entityId = (id: string) => `how-to-make-a-presentation:${id}`

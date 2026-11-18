export interface Entity { id: string; kind: string; label: string; description?: string; x: number; y: number; w: number; h: number; beat: number }
export const entities: Entity[] = [
  { id: 'you', kind: 'person', label: 'you', x: 90, y: 45, w: 106, h: 58, beat: 1 },
  { id: 'prompt', kind: 'bubble', label: 'a topic', x: 216, y: 52, w: 172, h: 44, beat: 1 },
  { id: 'skill', kind: 'skill', label: 'skill', x: 575, y: 45, w: 122, h: 58, beat: 2 },
  { id: 'conversation', kind: 'connection', label: '↔', x: 400, y: 49, w: 148, h: 48, beat: 2 },
  { id: 'question', kind: 'chip', label: 'question', x: 370, y: 3, w: 205, h: 36, beat: 2 },
  { id: 'tray', kind: 'tray', label: 'steps', x: 60, y: 145, w: 796, h: 176, beat: 3 },
  { id: 'card-1', kind: 'card', label: '01', description: 'Step 1: the idea — title, caption, visual', x: 76, y: 184, w: 142, h: 130, beat: 3 },
  { id: 'morph-1', kind: 'link', label: 'morph →', x: 220, y: 225, w: 140, h: 40, beat: 4 },
  { id: 'card-2', kind: 'card', label: '02', description: 'Step 2: the story — title, caption, visual', x: 362, y: 184, w: 142, h: 130, beat: 4 },
  { id: 'depth', kind: 'depth', label: 'partial ↔ full', x: 40, y: 108, w: 215, h: 34, beat: 5 },
  { id: 'ghost', kind: 'ghost', label: '…', description: 'Unspecified steps', x: 520, y: 184, w: 142, h: 130, beat: 5 },
  { id: 'kit', kind: 'socket', label: 'scene kit', x: 253, y: 313, w: 345, h: 38, beat: 6 },
  { id: 'verify-link', kind: 'link', label: '→', x: 666, y: 225, w: 36, h: 40, beat: 7 },
  { id: 'verify', kind: 'verify', label: '✓ pass', x: 710, y: 184, w: 142, h: 130, beat: 7 },
  { id: 'modify', kind: 'modify', label: 'modify ↴', x: 710, y: 75, w: 130, h: 109, beat: 8 },
  { id: 'edited', kind: 'flag', label: 'edited', x: 378, y: 146, w: 110, h: 36, beat: 8 },
  { id: 'reveal', kind: 'frame', label: 'this is one', x: 16, y: 3, w: 848, h: 365, beat: 9 },
]
export const entityId = (id: string) => `how-to-make-a-presentation:${id}`
export const stateFor = (beat: number) => entities.filter(entity => entity.beat <= beat)

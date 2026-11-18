export interface Entity { id: string; kind: string; label: string; x: number; y: number; w: number; h: number; beat: number }
export const entities: Entity[] = [
  { id: 'you', kind: 'person', label: 'you', x: 90, y: 45, w: 106, h: 58, beat: 1 },
  { id: 'prompt', kind: 'bubble', label: 'I have a topic…', x: 216, y: 56, w: 172, h: 36, beat: 1 },
  { id: 'skill', kind: 'skill', label: 'skill', x: 575, y: 45, w: 122, h: 58, beat: 2 },
  { id: 'conversation', kind: 'connection', label: '↔', x: 400, y: 49, w: 148, h: 48, beat: 2 },
  { id: 'question', kind: 'chip', label: 'one question at a time', x: 370, y: 13, w: 205, h: 25, beat: 2 },
  { id: 'tray', kind: 'tray', label: 'YOUR STORY / STEP BY STEP', x: 84, y: 143, w: 718, h: 176, beat: 3 },
  { id: 'card-1', kind: 'card', label: '01 / the idea', x: 102, y: 190, w: 134, h: 103, beat: 3 },
  { id: 'morph-1', kind: 'link', label: 'morph →', x: 240, y: 223, w: 71, h: 27, beat: 4 },
  { id: 'card-2', kind: 'card', label: '02 / the story', x: 316, y: 190, w: 134, h: 103, beat: 4 },
  { id: 'depth', kind: 'depth', label: 'partial ↔ full', x: 78, y: 111, w: 130, h: 25, beat: 5 },
  { id: 'ghost', kind: 'ghost', label: '… your next beat', x: 468, y: 190, w: 134, h: 103, beat: 5 },
  { id: 'kit', kind: 'socket', label: 'scene kit / boxes · arrows · motion', x: 253, y: 311, w: 345, h: 27, beat: 6 },
  { id: 'verify-link', kind: 'link', label: '→', x: 608, y: 223, w: 36, h: 27, beat: 7 },
  { id: 'verify', kind: 'verify', label: '✓ pass', x: 651, y: 190, w: 134, h: 103, beat: 7 },
  { id: 'modify', kind: 'modify', label: 'modify ↴', x: 715, y: 75, w: 115, h: 89, beat: 8 },
  { id: 'edited', kind: 'flag', label: 'edited', x: 345, y: 166, w: 75, h: 22, beat: 8 },
  { id: 'reveal', kind: 'frame', label: 'AND SCENE / THIS IS ONE', x: 34, y: 3, w: 812, h: 357, beat: 9 },
]
export const entityId = (id: string) => `how-to-make-a-presentation:${id}`
export const stateFor = (beat: number) => entities.filter(entity => entity.beat <= beat)

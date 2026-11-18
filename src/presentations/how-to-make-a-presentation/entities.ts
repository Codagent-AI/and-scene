export interface Entity { id: string; from: number; x: number; y: number; width: number; height: number; kind: string; label: string; detail?: string }
export const entities: Entity[] = [
  { id: 'you', from: 0, x: 50, y: 48, width: 120, height: 66, kind: 'person', label: 'you', detail: 'a little curious' },
  { id: 'prompt', from: 0, x: 205, y: 48, width: 174, height: 66, kind: 'prompt', label: '“I have a topic…”', detail: 'the starting point' },
  { id: 'skill', from: 1, x: 710, y: 48, width: 120, height: 66, kind: 'skill', label: 'skill', detail: 'your scene partner' },
  { id: 'question', from: 1, x: 456, y: 22, width: 186, height: 28, kind: 'chip', label: 'one question at a time' },
  { id: 'conversation', from: 1, x: 409, y: 70, width: 270, height: 24, kind: 'conversation', label: '←────────────────→' },
  { id: 'tray', from: 2, x: 50, y: 286, width: 780, height: 14, kind: 'tray', label: 'YOUR STORY / A GROWING SCENE' },
  { id: 'card-1', from: 2, x: 50, y: 176, width: 120, height: 96, kind: 'card', label: '01 / the idea', detail: 'title · caption · visual' },
  { id: 'link-1', from: 3, x: 176, y: 210, width: 33, height: 40, kind: 'link', label: '→', detail: 'morph' },
  { id: 'card-2', from: 3, x: 215, y: 176, width: 120, height: 96, kind: 'card', label: '02 / a beat', detail: 'title · caption · visual' },
  { id: 'link-2', from: 3, x: 341, y: 210, width: 33, height: 40, kind: 'link', label: '→', detail: 'morph' },
  { id: 'card-3', from: 3, x: 380, y: 176, width: 120, height: 96, kind: 'card', label: '03 / the next', detail: 'title · caption · visual' },
  { id: 'depth', from: 4, x: 50, y: 122, width: 120, height: 26, kind: 'depth', label: 'partial ↔ full' },
  { id: 'ghost', from: 4, x: 545, y: 176, width: 120, height: 96, kind: 'ghost', label: '… / your call', detail: 'room for more' },
  { id: 'kit', from: 5, x: 269, y: 300, width: 220, height: 48, kind: 'kit', label: 'shared scene kit', detail: 'boxes · arrows · motion' },
  { id: 'pipeline', from: 6, x: 671, y: 210, width: 33, height: 40, kind: 'link', label: '→' },
  { id: 'verify', from: 6, x: 710, y: 176, width: 120, height: 96, kind: 'verify', label: '✓ verify', detail: 'build ✓  render ✓' },
  { id: 'edited', from: 7, x: 388, y: 151, width: 102, height: 20, kind: 'flag', label: 'edited in place' },
  { id: 'reveal', from: 8, x: 18, y: 4, width: 844, height: 366, kind: 'reveal', label: 'THIS IS ONE OF THOSE SCENES.' },
]
export const visibleEntities = (beat: number) => entities.filter(entity => entity.from <= beat)
export const identity = (id: string) => `how-to-make-a-presentation:${id}`

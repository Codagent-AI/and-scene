export const entityId = (name: string) => `how-to-make-a-presentation:${name}`
export interface Entity {
  name: string
  from: number
  x: number
  y: number
  width: number
  height: number
  kind: 'box' | 'label' | 'arrow' | 'frame'
  text: string
  detail?: string
  tone?: string
}
// Each entity is allocated once. Later beats add to this composition.
export const ENTITIES: readonly Entity[] = [
  { name: 'you', from: 1, x: 58, y: 52, width: 110, height: 64, kind: 'box', text: 'you', detail: 'THE STORYTELLER' },
  { name: 'prompt', from: 1, x: 58, y: 14, width: 190, height: 28, kind: 'label', text: '“I have a topic…”', tone: 'prompt' },
  { name: 'skill', from: 2, x: 516, y: 52, width: 156, height: 64, kind: 'box', text: 'the skill', detail: 'YOUR SCENE PARTNER', tone: 'accent' },
  { name: 'conversation', from: 2, x: 188, y: 70, width: 308, height: 24, kind: 'arrow', text: '↔' },
  { name: 'question', from: 2, x: 267, y: 32, width: 150, height: 26, kind: 'label', text: 'one question at a time', tone: 'chip' },
  { name: 'tray', from: 3, x: 58, y: 167, width: 740, height: 158, kind: 'label', text: 'THE STORY / GATHERED IN PLACE', tone: 'tray' },
  { name: 'card-1', from: 3, x: 70, y: 205, width: 138, height: 94, kind: 'box', text: '01 / The idea', detail: 'title · caption · visual', tone: 'card' },
  { name: 'link-1', from: 4, x: 210, y: 222, width: 46, height: 50, kind: 'arrow', text: '→', detail: 'morph' },
  { name: 'card-2', from: 4, x: 258, y: 205, width: 138, height: 94, kind: 'box', text: '02 / A new beat', detail: 'title · caption · visual', tone: 'card' },
  { name: 'link-2', from: 4, x: 398, y: 222, width: 46, height: 50, kind: 'arrow', text: '→', detail: 'morph' },
  { name: 'card-3', from: 4, x: 446, y: 205, width: 138, height: 94, kind: 'box', text: '03 / Connection', detail: 'title · caption · visual', tone: 'card' },
  { name: 'ghost', from: 5, x: 700, y: 205, width: 83, height: 94, kind: 'box', text: '…', detail: 'your next beat', tone: 'ghost' },
  { name: 'depth', from: 5, x: 58, y: 119, width: 165, height: 25, kind: 'label', text: 'partial ↔ full / you decide', tone: 'depth' },
  { name: 'scene-kit', from: 6, x: 278, y: 314, width: 284, height: 33, kind: 'box', text: '⊞  shared scene kit', detail: 'boxes · arrows · motion', tone: 'socket' },
  { name: 'link-verify', from: 7, x: 585, y: 235, width: 27, height: 25, kind: 'arrow', text: '→' },
  { name: 'verify', from: 7, x: 614, y: 205, width: 75, height: 94, kind: 'box', text: '✓', detail: 'build + render', tone: 'verify' },
  { name: 'modify', from: 8, x: 688, y: 60, width: 114, height: 135, kind: 'label', text: '↶', detail: 'edit in place', tone: 'modify' },
  { name: 'edited', from: 8, x: 266, y: 181, width: 77, height: 19, kind: 'label', text: '↳ refined', tone: 'edited' },
  { name: 'reveal', from: 9, x: 28, y: 0, width: 802, height: 368, kind: 'frame', text: 'AND SCENE / YOU ARE LOOKING AT ONE', tone: 'reveal' },
]
export function entitiesForBeat(beat: number) { return ENTITIES.filter(entity => entity.from <= beat) }

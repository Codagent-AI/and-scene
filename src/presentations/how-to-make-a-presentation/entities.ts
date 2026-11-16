export interface Entity {
  id: string
  kind: 'box' | 'label' | 'arrow' | 'frame' | 'chip'
  x: number
  y: number
  w: number
  h: number
  text: string
  detail?: string
  from: number
}
export const ENTITIES: readonly Entity[] = [
  { id: 'you', kind: 'box', x: 110, y: 53, w: 140, h: 64, text: 'you', detail: 'an idea worth sharing', from: 1 },
  { id: 'prompt', kind: 'chip', x: 110, y: 15, w: 140, h: 28, text: '“I have a topic…”', from: 1 },
  { id: 'skill', kind: 'box', x: 590, y: 53, w: 170, h: 64, text: 'the skill', detail: 'a conversation partner', from: 2 },
  { id: 'conversation', kind: 'arrow', x: 270, y: 75, w: 300, h: 22, text: '↔', from: 2 },
  { id: 'question', kind: 'chip', x: 337, y: 34, w: 166, h: 28, text: 'one question at a time', from: 2 },
  { id: 'tray', kind: 'label', x: 92, y: 190, w: 740, h: 119, text: '', from: 3 },
  { id: 'card-1', kind: 'box', x: 112, y: 204, w: 130, h: 92, text: '01 / the idea', detail: 'title · caption · visual', from: 3 },
  { id: 'morph-1', kind: 'arrow', x: 247, y: 231, w: 58, h: 30, text: '→', detail: 'morphs', from: 4 },
  { id: 'card-2', kind: 'box', x: 310, y: 204, w: 130, h: 92, text: '02 / the story', detail: 'title · caption · visual', from: 4 },
  { id: 'morph-2', kind: 'arrow', x: 445, y: 231, w: 50, h: 30, text: '→', detail: 'morphs', from: 4 },
  { id: 'card-3', kind: 'box', x: 500, y: 204, w: 130, h: 92, text: '03 / the insight', detail: 'title · caption · visual', from: 4 },
  { id: 'ghost', kind: 'box', x: 645, y: 204, w: 48, h: 92, text: '…', from: 5 },
  { id: 'depth', kind: 'chip', x: 110, y: 128, w: 140, h: 30, text: 'partial ↔ full', from: 5 },
  { id: 'kit', kind: 'box', x: 350, y: 309, w: 225, h: 43, text: '⌁  shared scene kit', from: 6 },
  { id: 'pipeline', kind: 'arrow', x: 695, y: 235, w: 15, h: 24, text: '→', from: 7 },
  { id: 'verify', kind: 'box', x: 714, y: 204, w: 100, h: 92, text: '✓ verified', detail: 'build + render', from: 7 },
  { id: 'modify', kind: 'label', x: 466, y: 143, w: 145, h: 28, text: '↶ modify in place', from: 8 },
  { id: 'flag', kind: 'chip', x: 327, y: 180, w: 96, h: 20, text: 'edited', from: 8 },
  { id: 'reveal', kind: 'frame', x: 54, y: 0, w: 790, h: 373, text: '', from: 9 },
  { id: 'reveal-label', kind: 'chip', x: 650, y: 351, w: 180, h: 22, text: 'and this is the presentation.', from: 9 },
]
export const visibleEntities = (beat: number) => ENTITIES.filter(e => e.from <= beat)

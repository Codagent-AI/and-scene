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
// One layout for every viewport and beat. Type is sized for the narrow fit;
// shorter labels and stacked card fields keep it readable without reflow.
export const ENTITIES: readonly Entity[] = [
  { id: 'you', kind: 'box', x: 110, y: 53, w: 140, h: 64, text: 'you', from: 1 },
  { id: 'prompt', kind: 'chip', x: 70, y: 9, w: 235, h: 38, text: '“a topic”', from: 1 },
  { id: 'skill', kind: 'box', x: 590, y: 53, w: 170, h: 64, text: 'the skill', from: 2 },
  { id: 'conversation', kind: 'arrow', x: 270, y: 61, w: 300, h: 48, text: '↔', from: 2 },
  { id: 'question', kind: 'chip', x: 330, y: 9, w: 235, h: 38, text: 'one question', from: 2 },
  { id: 'tray', kind: 'label', x: 28, y: 166, w: 824, h: 170, text: '', from: 3 },
  { id: 'card-1', kind: 'box', x: 40, y: 174, w: 140, h: 154, text: '01', detail: 'title · caption · visual', from: 3 },
  { id: 'morph-1', kind: 'arrow', x: 180, y: 226, w: 100, h: 88, text: '→', detail: 'morph', from: 4 },
  { id: 'card-2', kind: 'box', x: 280, y: 174, w: 140, h: 154, text: '02', detail: 'title · caption · visual', from: 4 },
  { id: 'morph-2', kind: 'arrow', x: 420, y: 226, w: 100, h: 88, text: '→', detail: 'morph', from: 4 },
  { id: 'card-3', kind: 'box', x: 520, y: 174, w: 140, h: 154, text: '03', detail: 'title · caption · visual', from: 4 },
  { id: 'ghost', kind: 'box', x: 668, y: 174, w: 40, h: 154, text: '…', from: 5 },
  { id: 'depth', kind: 'chip', x: 110, y: 128, w: 210, h: 36, text: 'partial ↔ full', from: 5 },
  { id: 'kit', kind: 'box', x: 270, y: 336, w: 340, h: 38, text: '⌁  shared scene kit', from: 6 },
  { id: 'pipeline', kind: 'arrow', x: 708, y: 237, w: 28, h: 40, text: '→', from: 7 },
  { id: 'verify', kind: 'box', x: 740, y: 174, w: 100, h: 154, text: '✓ verify', detail: 'build + render', from: 7 },
  { id: 'modify', kind: 'label', x: 455, y: 132, w: 170, h: 36, text: '↶ modify', from: 8 },
  { id: 'flag', kind: 'chip', x: 325, y: 132, w: 100, h: 38, text: 'edited', from: 8 },
  { id: 'reveal', kind: 'frame', x: 28, y: 0, w: 824, h: 380, text: '', from: 9 },
  { id: 'reveal-label', kind: 'chip', x: 585, y: 9, w: 235, h: 38, text: 'a presentation', from: 9 },
]
export const visibleEntities = (beat: number) => ENTITIES.filter(e => e.from <= beat)

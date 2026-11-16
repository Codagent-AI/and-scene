export const entity = (id: string) => `how-to:${id}`
export interface EntityState { id: string; kind: 'box' | 'label' | 'arrow' | 'frame' | 'chip'; x: number; y: number; width: number; height: number; text: string; detail?: string; role?: string }
const all: (EntityState & { from: number })[] = [
  { id: 'you', kind: 'box', x: 65, y: 56, width: 120, height: 70, text: 'you', detail: 'topic', from: 1 },
  { id: 'prompt', kind: 'chip', x: 230, y: 10, width: 280, height: 28, text: '“Explain this.”', from: 1 },
  { id: 'skill', kind: 'box', x: 640, y: 56, width: 160, height: 70, text: 'skill', detail: 'partner', from: 2 },
  { id: 'conversation', kind: 'arrow', x: 205, y: 86, width: 410, height: 32, text: '↔', from: 2 },
  { id: 'question', kind: 'chip', x: 290, y: 45, width: 240, height: 28, text: 'one at a time', from: 2 },
  { id: 'tray', kind: 'label', x: 65, y: 172, width: 720, height: 20, text: 'STEPS', role: 'tray', from: 3 },
  { id: 'card-1', kind: 'box', x: 65, y: 195, width: 140, height: 140, text: '01 idea', detail: 'title\ncaption\nvisual', role: 'card', from: 3 },
  { id: 'morph-1', kind: 'arrow', x: 210, y: 228, width: 25, height: 30, text: '→', detail: 'morph', from: 4 },
  { id: 'card-2', kind: 'box', x: 240, y: 195, width: 140, height: 140, text: '02 story', detail: 'title\ncaption\nvisual', role: 'card', from: 4 },
  { id: 'morph-2', kind: 'arrow', x: 385, y: 228, width: 25, height: 30, text: '→', detail: 'morph', from: 4 },
  { id: 'card-3', kind: 'box', x: 415, y: 195, width: 140, height: 140, text: '03 point', detail: 'title\ncaption\nvisual', role: 'card', from: 4 },
  { id: 'ghost', kind: 'box', x: 590, y: 195, width: 120, height: 140, text: '… next', detail: 'your\ncall', role: 'ghost', from: 5 },
  { id: 'depth', kind: 'chip', x: 65, y: 128, width: 240, height: 22, text: 'partial ↔ full', from: 5 },
  { id: 'kit', kind: 'box', x: 315, y: 335, width: 260, height: 40, text: 'SCENE KIT', role: 'socket', from: 6 },
  { id: 'pipeline', kind: 'arrow', x: 715, y: 228, width: 20, height: 30, text: '→', from: 7 },
  { id: 'verify', kind: 'box', x: 740, y: 195, width: 105, height: 140, text: 'verify', detail: 'build\nrender\n✓', role: 'verify', from: 7 },
  { id: 'modify', kind: 'label', x: 705, y: 145, width: 160, height: 24, text: '↙ modify', role: 'modify', from: 8 },
  { id: 'reveal', kind: 'frame', x: 12, y: 5, width: 856, height: 373, text: 'THE EXAMPLE', role: 'reveal', from: 9 },
]
export function sceneState(beat: number): EntityState[] { return all.filter(item => item.from <= beat).map(({ from, ...item }) => { void from; return item }) }

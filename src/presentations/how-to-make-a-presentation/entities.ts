export const entity = (name: string) => `how-to-make-a-presentation:${name}`
export interface DiagramEntity { id: string; text: string; x: number; y: number; w: number; h: number; kind: string; detail?: string }
const all: DiagramEntity[] = [
  { id: 'you', text: 'you', x: 64, y: 42, w: 112, h: 62, kind: 'person' },
  { id: 'prompt', text: '“I have a topic…”', x: 200, y: 54, w: 220, h: 40, kind: 'prompt' },
  { id: 'skill', text: 'skill', x: 502, y: 42, w: 112, h: 62, kind: 'skill' },
  { id: 'conversation', text: '⟷', x: 438, y: 54, w: 46, h: 40, kind: 'connector' },
  { id: 'question', text: 'one question at a time', x: 202, y: 10, w: 218, h: 30, kind: 'chip' },
  { id: 'tray', text: 'YOUR STORY / AN EVOLVING SCENE', x: 64, y: 152, w: 750, h: 150, kind: 'tray' },
  { id: 'card-1', text: '01 / The opening', detail: 'title · caption · visual', x: 84, y: 194, w: 152, h: 80, kind: 'card' },
  { id: 'morph-1', text: 'morph →', x: 240, y: 221, w: 64, h: 24, kind: 'link' },
  { id: 'card-2', text: '02 / The idea', detail: 'title · caption · visual', x: 310, y: 194, w: 152, h: 80, kind: 'card' },
  { id: 'morph-2', text: 'morph →', x: 466, y: 221, w: 64, h: 24, kind: 'link' },
  { id: 'card-3', text: '03 / The payoff', detail: 'title · caption · visual', x: 536, y: 194, w: 152, h: 80, kind: 'card' },
  { id: 'ghost', text: '+ your next beat', x: 654, y: 48, w: 160, h: 52, kind: 'ghost' },
  { id: 'depth', text: 'partial ⟷ full', x: 64, y: 108, w: 112, h: 26, kind: 'depth' },
  { id: 'kit', text: '↳ shared scene kit', x: 310, y: 302, w: 210, h: 36, kind: 'kit' },
  { id: 'verify', text: '✓ pass', detail: 'build + render', x: 708, y: 194, w: 90, h: 80, kind: 'verify' },
  { id: 'modify', text: '↳ modify in place', x: 502, y: 112, w: 200, h: 30, kind: 'modify' },
  { id: 'reveal', text: 'AND SCENE / YOU’RE LOOKING AT ONE', x: 30, y: 0, w: 820, h: 372, kind: 'reveal' },
]
export function diagram(beat: number) {
  const ids = ['you', 'prompt', ...(beat >= 2 ? ['skill','conversation','question'] : []), ...(beat >= 3 ? ['tray','card-1'] : []), ...(beat >= 4 ? ['morph-1','card-2','morph-2','card-3'] : []), ...(beat >= 5 ? ['ghost','depth'] : []), ...(beat >= 6 ? ['kit'] : []), ...(beat >= 7 ? ['verify'] : []), ...(beat >= 8 ? ['modify'] : []), ...(beat >= 9 ? ['reveal'] : [])]
  return all.filter(e => ids.includes(e.id))
}

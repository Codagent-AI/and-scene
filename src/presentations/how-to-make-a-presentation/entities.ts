export const entity = (id: string) => `how-to:${id}`
export interface DiagramEntity { id: string; x: number; y: number; w: number; h: number; label: string; kind: string }
const node = (id: string, x: number, y: number, w: number, h: number, label: string, kind = 'card'): DiagramEntity => ({ id: entity(id), x, y, w, h, label, kind })
// Coordinates are immutable: later beats only add entities or flag the edited card.
export function diagram(beat: number): DiagramEntity[] {
  return [
    node('you', 48, 54, 98, 66, 'you', 'person'),
    node('prompt', 168, 43, 192, 76, 'A topic. A possibility.', 'bubble'),
    ...(beat >= 2 ? [node('skill', 550, 54, 130, 66, 'skill', 'skill'), node('conversation', 380, 70, 146, 28, '↔', 'conversation'), node('question', 380, 25, 146, 32, 'one question at a time', 'chip')] : []),
    ...(beat >= 3 ? [node('tray', 48, 188, 760, 128, '', 'tray'), node('step-1', 64, 205, 142, 88, '01 / title\ncaption\nvisual', 'step')] : []),
    ...(beat >= 4 ? [node('morph-1', 210, 233, 58, 40, 'morph →', 'link'), node('step-2', 272, 205, 142, 88, '02 / same shapes\nnew beat\nnew state', 'step'), node('morph-2', 420, 233, 58, 40, 'morph →', 'link'), node('step-3', 482, 205, 142, 88, '03 / next beat\nkeep the thread\nmove in place', 'step')] : []),
    ...(beat >= 5 ? [node('ghost', 646, 205, 142, 30, '… your next steps', 'ghost'), node('depth', 46, 135, 170, 30, 'partial ↔ full', 'depth')] : []),
    ...(beat >= 6 ? [node('scene-kit', 302, 308, 270, 42, '⊕ shared scene kit · boxes / arrows / motion', 'socket')] : []),
    ...(beat >= 7 ? [node('verify-link', 628, 255, 28, 25, '→', 'link'), node('verify', 660, 248, 128, 46, '✓ build + render', 'verify')] : []),
    ...(beat >= 8 ? [node('modify', 610, 128, 160, 62, '↘ modify in place', 'modify')] : []),
    ...(beat >= 9 ? [node('reveal', 20, 5, 820, 366, 'AND SCENE / you are looking at one', 'reveal')] : []),
  ]
}

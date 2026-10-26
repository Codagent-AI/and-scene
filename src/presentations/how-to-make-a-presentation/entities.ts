export interface Entity { id: string; born: number; x: number; y: number; w: number; h: number; label: string; kind: string }
const entity = (name: string, born: number, x: number, y: number, w: number, h: number, label: string, kind = 'node'): Entity => ({ id: `how-to:${name}`, born, x, y, w, h, label, kind })
export const entities = [
  entity('you', 1, 60, 44, 150, 58, 'you', 'person'),
  entity('prompt', 1, 260, 105, 330, 35, '“I have a topic…”', 'prompt'),
  entity('skill', 2, 650, 44, 170, 58, 'presentation skill', 'skill'),
  entity('conversation', 2, 225, 52, 410, 30, '↔', 'conversation'),
  entity('question', 2, 345, 9, 190, 29, 'one question at a time', 'chip'),
  entity('tray', 3, 60, 158, 760, 18, 'YOUR STORY / STEP BY STEP', 'tray'),
  entity('card-1', 3, 60, 190, 150, 88, '01', 'card'),
  entity('card-2', 4, 235, 190, 150, 88, '02', 'card'),
  entity('morph-1', 4, 211, 225, 24, 45, '→', 'morph'),
  entity('card-3', 4, 410, 190, 150, 88, '03', 'card'),
  entity('morph-2', 4, 386, 225, 24, 45, '→', 'morph'),
  entity('ghost', 5, 585, 190, 98, 88, '…', 'ghost'),
  entity('depth', 5, 60, 111, 150, 29, 'partial ↔ full', 'depth'),
  entity('scene-kit', 6, 235, 300, 325, 43, 'shared scene kit · boxes / arrows / motion', 'socket'),
  entity('socket-link', 6, 391, 279, 14, 21, '│', 'socket-link'),
  entity('verify', 7, 710, 190, 110, 88, 'verify', 'verify'),
  entity('verify-link', 7, 683, 216, 27, 25, '→', 'verify-link'),
  entity('modify', 8, 490, 143, 330, 38, 'modify ↶', 'modify'),
  entity('reveal', 9, 17, 2, 846, 365, "THIS IS ONE OF THOSE PRESENTATIONS", 'reveal'),
] as const
export const entitiesAt = (beat: number) => entities.filter(e => e.born <= beat)

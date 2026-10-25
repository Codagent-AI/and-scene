export const entityId = (name: string) => `how-to-make-a-presentation:${name}`
export interface Entity { name: string; label: string; detail?: string; x: number; y: number; w: number; h: number; kind: string }
const you: Entity = { name: 'you', label: 'you', detail: 'the storyteller', x: 68, y: 35, w: 120, h: 64, kind: 'person' }
const prompt: Entity = { name: 'prompt', label: 'a topic worth explaining', x: 70, y: 8, w: 230, h: 23, kind: 'prompt' }
const skill: Entity = { name: 'skill', label: 'skill', detail: 'the scene builder', x: 626, y: 35, w: 154, h: 64, kind: 'skill' }
const conversation: Entity = { name: 'conversation', label: '← conversation →', x: 286, y: 60, w: 258, h: 24, kind: 'connection' }
const question: Entity = { name: 'question', label: 'one question at a time', x: 302, y: 30, w: 230, h: 25, kind: 'chip' }
const tray: Entity = { name: 'tray', label: 'YOUR STORY / ONE EVOLVING SCENE', x: 66, y: 146, w: 716, h: 144, kind: 'tray' }
const card = (n: number): Entity => ({ name: `card-${n}`, label: `0${n} / ${['the idea', 'the shape', 'the story'][n-1]}`, detail: 'title · caption · visual', x: 84 + (n - 1) * 164, y: 187, w: 140, h: 78, kind: 'card' })
const morph = (n: number): Entity => ({ name: `morph-${n}`, label: 'morph →', x: 225 + (n-1)*164, y: 212, w: 24, h: 20, kind: 'morph' })
const additions: Entity[][] = [
  [you, prompt],
  [skill, conversation, question],
  [tray, card(1)],
  [card(2), card(3), morph(1), morph(2)],
  [{ name: 'ghost', label: '+ your next beat', x: 576, y: 187, w: 100, h: 78, kind: 'ghost' }, { name: 'depth', label: 'partial ↔ full', x: 68, y: 106, w: 120, h: 25, kind: 'depth' }],
  [{ name: 'kit', label: 'shared scene kit', detail: 'boxes · arrows · motion', x: 286, y: 290, w: 270, h: 44, kind: 'socket' }],
  [{ name: 'verify', label: '✓ verify', detail: 'build + render', x: 692, y: 187, w: 100, h: 78, kind: 'verify' }, { name: 'verify-link', label: '→', x: 677, y: 217, w: 15, h: 18, kind: 'connection' }],
  [{ name: 'modify', label: '↘ modify in place', x: 456, y: 112, w: 240, h: 53, kind: 'modify' }, { name: 'edited', label: 'edited', x: 452, y: 267, w: 70, h: 20, kind: 'edited' }],
  [{ name: 'reveal', label: 'AND SCENE / YOU’RE LOOKING AT ONE', x: 32, y: 0, w: 804, h: 366, kind: 'reveal' }],
]
export const sceneStates = additions.map((_, i) => additions.slice(0, i + 1).flat())

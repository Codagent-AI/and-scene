export const entities = {
  you: { at: 1, x: 72, y: 62, w: 112, h: 60, label: 'you', kind: 'person' },
  prompt: { at: 1, x: 72, y: 133, w: 178, h: 36, label: 'a topic worth explaining', kind: 'prompt' },
  skill: { at: 2, x: 668, y: 62, w: 136, h: 60, label: 'the skill', kind: 'skill' },
  conversation: { at: 2, x: 205, y: 78, w: 440, h: 30, label: '←──────────────────→', kind: 'connection' },
  question: { at: 2, x: 333, y: 28, w: 224, h: 32, label: 'one question at a time', kind: 'question' },
  tray: { at: 3, x: 60, y: 194, w: 760, h: 104, label: '', kind: 'tray' },
  card1: { at: 3, x: 82, y: 208, w: 130, h: 76, label: '01 · the idea', kind: 'card' },
  link1: { at: 4, x: 218, y: 223, w: 30, h: 50, label: '→', kind: 'link' },
  card2: { at: 4, x: 254, y: 208, w: 130, h: 76, label: '02 · the story', kind: 'card' },
  link2: { at: 4, x: 390, y: 223, w: 30, h: 50, label: '→', kind: 'link' },
  card3: { at: 4, x: 426, y: 208, w: 130, h: 76, label: '03 · the scene', kind: 'card' },
  ghost: { at: 5, x: 576, y: 208, w: 100, h: 76, label: 'your next beat', kind: 'ghost' },
  depth: { at: 5, x: 62, y: 17, w: 154, h: 28, label: 'partial ↔ full', kind: 'depth' },
  socket: { at: 6, x: 308, y: 298, w: 264, h: 44, label: 'scene-kit · shapes + motion', kind: 'socket' },
  pipeline: { at: 7, x: 682, y: 232, w: 22, h: 22, label: '→', kind: 'connection' },
  verify: { at: 7, x: 710, y: 208, w: 94, h: 76, label: 'verify', kind: 'verify' },
  modify: { at: 8, x: 260, y: 137, w: 370, h: 59, label: 'ask → edit → keep going', kind: 'modify' },
  reveal: { at: 9, x: 16, y: 5, w: 848, h: 364, label: 'AND SCENE / THIS IS THE PRESENTATION', kind: 'reveal' },
} as const
export type EntityKey = keyof typeof entities
export const entityId = (key: EntityKey) => `how-to-make-a-presentation:${key}`
export const visibleEntities = (beat: number) => (Object.keys(entities) as EntityKey[]).filter(key => entities[key].at <= beat)

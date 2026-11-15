export const entity = (name: string) => `how-to-make-a-presentation:${name}`
// An explicit portrait-friendly canvas keeps the same diagram at every viewport.
export const SAMPLE_WIDTH = 480
export const SAMPLE_HEIGHT = 600
export const positions = {
  you: { x: 20, y: 60, w: 160, h: 62 }, prompt: { x: 20, y: 184, w: 220, h: 52 },
  skill: { x: 300, y: 60, w: 160, h: 62 }, conversation: { x: 188, y: 86, w: 104, h: 30 },
  question: { x: 176, y: 12, w: 128, h: 48 }, tray: { x: 8, y: 250, w: 464, h: 220 },
  card1: { x: 12, y: 266, w: 80, h: 184 }, card2: { x: 110, y: 266, w: 108, h: 184 },
  card3: { x: 236, y: 266, w: 92, h: 184 }, link1: { x: 92, y: 300, w: 18, h: 110 },
  link2: { x: 218, y: 300, w: 18, h: 110 }, ghost: { x: 334, y: 280, w: 42, h: 156 },
  depth: { x: 20, y: 122, w: 160, h: 48 }, kit: { x: 100, y: 470, w: 280, h: 64 },
  link3: { x: 376, y: 340, w: 14, h: 30 },
  verify: { x: 390, y: 266, w: 78, h: 184 }, modify: { x: 164, y: 122, w: 240, h: 144 },
  reveal: { x: 4, y: 0, w: 472, h: 580 },
} as const
export type EntityName = keyof typeof positions
export function geometry(name: EntityName) { const p = positions[name]; return { position: 'absolute' as const, left: p.x, top: p.y, width: p.w, height: p.h } }
export function visibleEntities(beat: number): EntityName[] {
  return (Object.keys(positions) as EntityName[]).filter(name => beat >= ({ you: 1, prompt: 1, skill: 2, conversation: 2, question: 2, tray: 3, card1: 3, card2: 4, card3: 4, link1: 4, link2: 4, ghost: 5, depth: 5, kit: 6, link3: 7, verify: 7, modify: 8, reveal: 9 }[name]))
}

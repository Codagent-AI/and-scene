export const entity = (name: string) => `how-to-make-a-presentation:${name}`
export const positions = {
  you: { x: 52, y: 20, w: 158, h: 62 }, prompt: { x: 52, y: 115, w: 158, h: 30 },
  skill: { x: 660, y: 20, w: 168, h: 62 }, conversation: { x: 234, y: 40, w: 402, h: 28 },
  question: { x: 350, y: 5, w: 172, h: 27 }, tray: { x: 40, y: 165, w: 800, h: 116 },
  card1: { x: 55, y: 181, w: 150, h: 84 }, card2: { x: 275, y: 181, w: 150, h: 84 },
  card3: { x: 495, y: 181, w: 150, h: 84 }, link1: { x: 211, y: 213, w: 58, h: 20 },
  link2: { x: 431, y: 213, w: 58, h: 20 }, ghost: { x: 658, y: 190, w: 58, h: 66 },
  depth: { x: 52, y: 82, w: 158, h: 28 }, kit: { x: 310, y: 281, w: 260, h: 47 },
  link3: { x: 716, y: 213, w: 18, h: 20 },
  verify: { x: 734, y: 183, w: 94, h: 80 }, modify: { x: 350, y: 82, w: 450, h: 99 },
  reveal: { x: 24, y: 0, w: 832, h: 355 },
} as const
export type EntityName = keyof typeof positions
export function geometry(name: EntityName) { const p = positions[name]; return { position: 'absolute' as const, left: p.x, top: p.y, width: p.w, height: p.h } }
export function visibleEntities(beat: number): EntityName[] {
  return (Object.keys(positions) as EntityName[]).filter(name => beat >= ({ you: 1, prompt: 1, skill: 2, conversation: 2, question: 2, tray: 3, card1: 3, card2: 4, card3: 4, link1: 4, link2: 4, ghost: 5, depth: 5, kit: 6, link3: 7, verify: 7, modify: 8, reveal: 9 }[name]))
}

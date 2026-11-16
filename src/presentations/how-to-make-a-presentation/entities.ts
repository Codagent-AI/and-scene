export const entity = (name: string) => `how-to:${name}`
// Coordinates never change as beats accumulate; these are presentation-owned geometry.
export const placements = [
  { name: 'you', at: 1, x: 60, y: 40, w: 125, h: 65 },
  { name: 'prompt', at: 1, x: 218, y: 40, w: 180, h: 65 },
  { name: 'exchange', at: 2, x: 428, y: 65, w: 120, h: 30 },
  { name: 'question', at: 2, x: 430, y: 30, w: 120, h: 28 },
  { name: 'skill', at: 2, x: 586, y: 40, w: 168, h: 65 },
  { name: 'tray', at: 3, x: 60, y: 186, w: 694, h: 115 },
  { name: 'card-1', at: 3, x: 78, y: 202, w: 142, h: 83 },
  { name: 'morph-1', at: 4, x: 225, y: 225, w: 36, h: 40 },
  { name: 'card-2', at: 4, x: 266, y: 202, w: 142, h: 83 },
  { name: 'morph-2', at: 4, x: 413, y: 225, w: 36, h: 40 },
  { name: 'card-3', at: 4, x: 454, y: 202, w: 142, h: 83 },
  { name: 'ghost', at: 5, x: 612, y: 202, w: 124, h: 30 },
  { name: 'depth', at: 5, x: 60, y: 111, w: 125, h: 26 },
  { name: 'kit', at: 6, x: 284, y: 301, w: 270, h: 38 },
  { name: 'verify-link', at: 7, x: 596, y: 254, w: 16, h: 20 },
  { name: 'verify', at: 7, x: 612, y: 243, w: 124, h: 42 },
  { name: 'modify', at: 8, x: 322, y: 130, w: 322, h: 50 },
  { name: 'edited', at: 8, x: 270, y: 178, w: 136, h: 20 },
  { name: 'reveal', at: 9, x: 28, y: 12, w: 776, h: 350 },
] as const
export function visibleEntities(beat: number) { return placements.filter(p => p.at <= beat) }

export const entity = (name: string) => `how-to:${name}`
// Coordinates never change as beats accumulate; these are presentation-owned geometry.
export const placements = [
  { name: 'you', at: 1, x: 60, y: 24, w: 125, h: 84 },
  { name: 'prompt', at: 1, x: 218, y: 24, w: 180, h: 84 },
  { name: 'exchange', at: 2, x: 428, y: 58, w: 120, h: 30 },
  { name: 'question', at: 2, x: 404, y: 10, w: 168, h: 40 },
  { name: 'skill', at: 2, x: 586, y: 24, w: 168, h: 84 },
  { name: 'tray', at: 3, x: 24, y: 184, w: 832, h: 150 },
  { name: 'card-1', at: 3, x: 36, y: 196, w: 156, h: 132 },
  { name: 'morph-1', at: 4, x: 192, y: 222, w: 96, h: 76 },
  { name: 'card-2', at: 4, x: 288, y: 196, w: 156, h: 132 },
  { name: 'morph-2', at: 4, x: 444, y: 222, w: 96, h: 76 },
  { name: 'card-3', at: 4, x: 540, y: 196, w: 156, h: 132 },
  { name: 'ghost', at: 5, x: 716, y: 196, w: 128, h: 40 },
  { name: 'depth', at: 5, x: 60, y: 114, w: 270, h: 44 },
  { name: 'kit', at: 6, x: 240, y: 334, w: 400, h: 40 },
  { name: 'verify-link', at: 7, x: 696, y: 272, w: 20, h: 24 },
  { name: 'verify', at: 7, x: 716, y: 244, w: 128, h: 84 },
  { name: 'modify', at: 8, x: 434, y: 108, w: 240, h: 90 },
  { name: 'edited', at: 8, x: 288, y: 160, w: 156, h: 40 },
  { name: 'reveal', at: 9, x: 12, y: 4, w: 856, h: 376 },
] as const
export function visibleEntities(beat: number) { return placements.filter(p => p.at <= beat) }

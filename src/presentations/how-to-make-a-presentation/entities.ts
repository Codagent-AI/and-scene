// Coordinates are shared by every beat and viewport. Typography is authored for
// the smallest supported fit instead of shrinking desktop-sized detail text.
export const entities = [
  { id: 'you', at: 1, x: 40, y: 58, w: 168, h: 88, label: 'you', detail: ['storyteller'] },
  { id: 'prompt', at: 1, x: 40, y: 10, w: 168, h: 40, label: 'your topic' },
  { id: 'conversation', at: 2, x: 232, y: 74, w: 224, h: 40, label: '', description: 'two-way conversation between you and skill' },
  { id: 'question', at: 2, x: 242, y: 10, w: 204, h: 40, label: 'question?' },
  { id: 'skill', at: 2, x: 480, y: 58, w: 160, h: 88, label: 'skill', detail: ['partner'] },
  { id: 'tray', at: 3, x: 24, y: 324, w: 832, h: 8, label: '' },
  { id: 'card-1', at: 3, x: 32, y: 192, w: 128, h: 132, label: 'title', detail: ['caption', 'visual'], description: 'Step 1 card: title, caption, visual' },
  { id: 'link-1', at: 4, x: 160, y: 220, w: 112, h: 76, label: '→', detail: ['morphs'] },
  { id: 'card-2', at: 4, x: 272, y: 192, w: 128, h: 132, label: 'title', detail: ['caption', 'visual'], description: 'Step 2 card: title, caption, visual' },
  { id: 'link-2', at: 4, x: 400, y: 220, w: 112, h: 76, label: '→', detail: ['morphs'] },
  { id: 'card-3', at: 4, x: 512, y: 192, w: 128, h: 132, label: 'title', detail: ['caption', 'visual'], description: 'Step 3 card: title, caption, visual' },
  { id: 'depth', at: 5, x: 212, y: 132, w: 224, h: 40, label: 'partial ↔ full' },
  { id: 'ghost', at: 5, x: 652, y: 192, w: 48, h: 132, label: '…' },
  { id: 'kit', at: 6, x: 270, y: 332, w: 300, h: 44, label: 'shared scene kit' },
  { id: 'verify-link', at: 7, x: 704, y: 242, w: 24, h: 32, label: '', description: 'then verify' },
  { id: 'verify', at: 7, x: 732, y: 192, w: 120, h: 132, label: 'verify', detail: ['build', 'render'] },
  { id: 'modify', at: 8, x: 658, y: 66, w: 182, h: 104, label: 'modify' },
  { id: 'edited', at: 8, x: 504, y: 148, w: 144, h: 40, label: 'edited' },
  { id: 'reveal', at: 9, x: 12, y: 0, w: 856, h: 380, label: 'this scene' },
] as const
export function visibleEntities(beat: number) { return entities.filter(entity => entity.at <= beat) }
export const entityId = (id: string) => `how-to-make-a-presentation:${id}`

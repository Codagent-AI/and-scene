export const entities = [
  { id: 'you', at: 1, x: 60, y: 58, w: 116, h: 64, label: 'you', detail: 'the storyteller' },
  { id: 'prompt', at: 1, x: 60, y: 18, w: 140, h: 28, label: 'I have a topic…' },
  { id: 'conversation', at: 2, x: 194, y: 78, w: 240, h: 24, label: '← conversation →' },
  { id: 'question', at: 2, x: 235, y: 38, w: 158, h: 28, label: 'one question at a time' },
  { id: 'skill', at: 2, x: 458, y: 58, w: 136, h: 64, label: 'skill', detail: 'the scene partner' },
  { id: 'tray', at: 3, x: 60, y: 280, w: 735, h: 8, label: '' },
  { id: 'card-1', at: 3, x: 70, y: 186, w: 128, h: 90, label: '01 / the opening', detail: 'title · caption · visual' },
  { id: 'link-1', at: 4, x: 200, y: 210, w: 60, h: 50, label: '→', detail: 'morphs' },
  { id: 'card-2', at: 4, x: 264, y: 186, w: 128, h: 90, label: '02 / the idea', detail: 'title · caption · visual' },
  { id: 'link-2', at: 4, x: 394, y: 210, w: 60, h: 50, label: '→', detail: 'morphs' },
  { id: 'card-3', at: 4, x: 458, y: 186, w: 128, h: 90, label: '03 / the payoff', detail: 'title · caption · visual' },
  { id: 'depth', at: 5, x: 60, y: 132, w: 148, h: 26, label: 'partial ↔ full' },
  { id: 'ghost', at: 5, x: 605, y: 186, w: 56, h: 90, label: '…' },
  { id: 'kit', at: 6, x: 270, y: 288, w: 300, h: 40, label: 'shared scene kit', detail: 'boxes · arrows · motion' },
  { id: 'verify-link', at: 7, x: 665, y: 218, w: 24, h: 28, label: '→' },
  { id: 'verify', at: 7, x: 694, y: 186, w: 112, h: 90, label: '✓ verify', detail: 'build + render' },
  { id: 'modify', at: 8, x: 610, y: 78, w: 198, h: 90, label: '↙ modify in place', detail: 'conversation → scene' },
  { id: 'edited', at: 8, x: 482, y: 160, w: 92, h: 20, label: 'edited ↙' },
  { id: 'reveal', at: 9, x: 24, y: 4, w: 824, h: 360, label: 'AND SCENE / you’re looking at one' },
] as const
export function visibleEntities(beat: number) { return entities.filter(entity => entity.at <= beat) }
export const entityId = (id: string) => `how-to-make-a-presentation:${id}`

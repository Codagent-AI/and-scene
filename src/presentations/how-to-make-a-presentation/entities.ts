export interface Entity { id: string; from: number; x: number; y: number; w: number; h: number; label: string; kind: string }
export const entities: readonly Entity[] = [
  {
    "id": "you",
    "from": 1,
    "x": 65,
    "y": 62,
    "w": 115,
    "h": 56,
    "label": "you",
    "kind": "box"
  },
  {
    "id": "prompt",
    "from": 1,
    "x": 65,
    "y": 20,
    "w": 155,
    "h": 28,
    "label": "I have a topic…",
    "kind": "label"
  },
  {
    "id": "skill",
    "from": 2,
    "x": 590,
    "y": 62,
    "w": 150,
    "h": 56,
    "label": "presentation skill",
    "kind": "box"
  },
  {
    "id": "exchange",
    "from": 2,
    "x": 210,
    "y": 77,
    "w": 345,
    "h": 26,
    "label": "← conversation →",
    "kind": "arrow"
  },
  {
    "id": "question",
    "from": 2,
    "x": 320,
    "y": 35,
    "w": 160,
    "h": 26,
    "label": "one question at a time",
    "kind": "chip"
  },
  {
    "id": "tray",
    "from": 3,
    "x": 55,
    "y": 180,
    "w": 770,
    "h": 120,
    "label": "",
    "kind": "tray"
  },
  {
    "id": "card1",
    "from": 3,
    "x": 75,
    "y": 195,
    "w": 130,
    "h": 92,
    "label": "01",
    "kind": "card"
  },
  {
    "id": "link1",
    "from": 4,
    "x": 209,
    "y": 229,
    "w": 65,
    "h": 30,
    "label": "morph →",
    "kind": "arrow"
  },
  {
    "id": "card2",
    "from": 4,
    "x": 280,
    "y": 195,
    "w": 130,
    "h": 92,
    "label": "02",
    "kind": "card"
  },
  {
    "id": "link2",
    "from": 4,
    "x": 414,
    "y": 229,
    "w": 65,
    "h": 30,
    "label": "morph →",
    "kind": "arrow"
  },
  {
    "id": "card3",
    "from": 4,
    "x": 485,
    "y": 195,
    "w": 130,
    "h": 92,
    "label": "03",
    "kind": "card"
  },
  {
    "id": "ghost",
    "from": 5,
    "x": 690,
    "y": 195,
    "w": 110,
    "h": 92,
    "label": "… next beat",
    "kind": "ghost"
  },
  {
    "id": "depth",
    "from": 5,
    "x": 65,
    "y": 128,
    "w": 155,
    "h": 26,
    "label": "partial ↔ full",
    "kind": "chip"
  },
  {
    "id": "kit",
    "from": 6,
    "x": 300,
    "y": 300,
    "w": 280,
    "h": 36,
    "label": "shared scene kit · boxes / arrows / motion",
    "kind": "socket"
  },
  {
    "id": "verify",
    "from": 7,
    "x": 690,
    "y": 195,
    "w": 110,
    "h": 92,
    "label": "verify",
    "kind": "verify"
  },
  {
    "id": "verify-link",
    "from": 7,
    "x": 619,
    "y": 229,
    "w": 65,
    "h": 30,
    "label": "check →",
    "kind": "arrow"
  },
  {
    "id": "modify",
    "from": 8,
    "x": 450,
    "y": 124,
    "w": 275,
    "h": 53,
    "label": "modify ↘",
    "kind": "modify"
  },
  {
    "id": "flag",
    "from": 8,
    "x": 486,
    "y": 175,
    "w": 104,
    "h": 18,
    "label": "edited in place",
    "kind": "flag"
  },
  {
    "id": "reveal",
    "from": 9,
    "x": 20,
    "y": 5,
    "w": 840,
    "h": 360,
    "label": "THIS IS ONE OF THOSE PRESENTATIONS",
    "kind": "frame"
  }
]
export const entityId = (id: string) => `how-to-make-a-presentation:${id}`
export const entitiesAt = (beat: number) => entities.filter(entity => entity.from <= beat)

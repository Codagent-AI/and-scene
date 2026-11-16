export interface Entity { id: string; from: number; x: number; y: number; w: number; h: number; label: string; kind: string }
export const entities: readonly Entity[] = [
  {
    "id": "you",
    "from": 1,
    "x": 65,
    "y": 50,
    "w": 115,
    "h": 56,
    "label": "you",
    "kind": "box"
  },
  {
    "id": "prompt",
    "from": 1,
    "x": 65,
    "y": 4,
    "w": 155,
    "h": 40,
    "label": "topic",
    "kind": "label"
  },
  {
    "id": "skill",
    "from": 2,
    "x": 590,
    "y": 50,
    "w": 150,
    "h": 56,
    "label": "skill",
    "kind": "box"
  },
  {
    "id": "exchange",
    "from": 2,
    "x": 210,
    "y": 58,
    "w": 345,
    "h": 40,
    "label": "← conversation →",
    "kind": "arrow"
  },
  {
    "id": "question",
    "from": 2,
    "x": 320,
    "y": 4,
    "w": 160,
    "h": 40,
    "label": "Q&A",
    "kind": "chip"
  },
  {
    "id": "tray",
    "from": 3,
    "x": 20,
    "y": 142,
    "w": 840,
    "h": 188,
    "label": "",
    "kind": "tray"
  },
  {
    "id": "card1",
    "from": 3,
    "x": 30,
    "y": 150,
    "w": 150,
    "h": 172,
    "label": "01",
    "kind": "card"
  },
  {
    "id": "link1",
    "from": 4,
    "x": 181,
    "y": 217,
    "w": 30,
    "h": 153,
    "label": "morph →",
    "kind": "arrow"
  },
  {
    "id": "card2",
    "from": 4,
    "x": 212,
    "y": 150,
    "w": 150,
    "h": 172,
    "label": "02",
    "kind": "card"
  },
  {
    "id": "link2",
    "from": 4,
    "x": 363,
    "y": 217,
    "w": 30,
    "h": 153,
    "label": "morph →",
    "kind": "arrow"
  },
  {
    "id": "card3",
    "from": 4,
    "x": 394,
    "y": 150,
    "w": 150,
    "h": 172,
    "label": "03",
    "kind": "card"
  },
  {
    "id": "ghost",
    "from": 5,
    "x": 556,
    "y": 150,
    "w": 110,
    "h": 172,
    "label": "… next beat",
    "kind": "ghost"
  },
  {
    "id": "depth",
    "from": 5,
    "x": 65,
    "y": 108,
    "w": 280,
    "h": 40,
    "label": "partial ↔ full",
    "kind": "chip"
  },
  {
    "id": "kit",
    "from": 6,
    "x": 510,
    "y": 330,
    "w": 340,
    "h": 40,
    "label": "shared scene kit",
    "kind": "socket"
  },
  {
    "id": "verify",
    "from": 7,
    "x": 698,
    "y": 150,
    "w": 150,
    "h": 172,
    "label": "verify",
    "kind": "verify"
  },
  {
    "id": "verify-link",
    "from": 7,
    "x": 667,
    "y": 217,
    "w": 30,
    "h": 40,
    "label": "→",
    "kind": "arrow"
  },
  {
    "id": "modify",
    "from": 8,
    "x": 470,
    "y": 108,
    "w": 340,
    "h": 42,
    "label": "modify ↘",
    "kind": "modify"
  },
  {
    "id": "flag",
    "from": 8,
    "x": 440,
    "y": 108,
    "w": 104,
    "h": 40,
    "label": "edit",
    "kind": "flag"
  },
  {
    "id": "reveal",
    "from": 9,
    "x": 20,
    "y": 5,
    "w": 840,
    "h": 370,
    "label": "This is one",
    "kind": "frame"
  }
]
export const entityId = (id: string) => `how-to-make-a-presentation:${id}`
export const entitiesAt = (beat: number) => entities.filter(entity => entity.from <= beat)

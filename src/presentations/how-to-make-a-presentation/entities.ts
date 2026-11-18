export interface Entity {
  id: string;
  from: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  detail: string;
}
// Positions are fixed for the whole narrative; later states only accumulate entities.
export const entities: Entity[] = [
  {
    "id": "you",
    "from": 1,
    "x": 30,
    "y": 80,
    "w": 110,
    "h": 65,
    "label": "you",
    "detail": ""
  },
  {
    "id": "prompt",
    "from": 1,
    "x": 285,
    "y": 150,
    "w": 190,
    "h": 44,
    "label": "a topic",
    "detail": ""
  },
  {
    "id": "skill",
    "from": 2,
    "x": 700,
    "y": 80,
    "w": 150,
    "h": 65,
    "label": "the skill",
    "detail": ""
  },
  {
    "id": "conversation",
    "from": 2,
    "x": 140,
    "y": 90,
    "w": 560,
    "h": 45,
    "label": "",
    "detail": ""
  },
  {
    "id": "question",
    "from": 2,
    "x": 170,
    "y": 56,
    "w": 500,
    "h": 44,
    "label": "one question at a time",
    "detail": ""
  },
  {
    "id": "tray",
    "from": 3,
    "x": 22,
    "y": 194,
    "w": 836,
    "h": 134,
    "label": "",
    "detail": ""
  },
  {
    "id": "card1",
    "from": 3,
    "x": 30,
    "y": 198,
    "w": 145,
    "h": 130,
    "label": "",
    "detail": "title · caption · visual"
  },
  {
    "id": "link1",
    "from": 4,
    "x": 180,
    "y": 198,
    "w": 40,
    "h": 130,
    "label": "",
    "detail": ""
  },
  {
    "id": "card2",
    "from": 4,
    "x": 225,
    "y": 198,
    "w": 145,
    "h": 130,
    "label": "",
    "detail": "title · caption · visual"
  },
  {
    "id": "link2",
    "from": 4,
    "x": 375,
    "y": 198,
    "w": 40,
    "h": 130,
    "label": "",
    "detail": ""
  },
  {
    "id": "card3",
    "from": 4,
    "x": 420,
    "y": 198,
    "w": 145,
    "h": 130,
    "label": "",
    "detail": "title · caption · visual"
  },
  {
    "id": "ghost",
    "from": 5,
    "x": 580,
    "y": 198,
    "w": 100,
    "h": 130,
    "label": "…",
    "detail": "next"
  },
  {
    "id": "depth",
    "from": 5,
    "x": 30,
    "y": 150,
    "w": 230,
    "h": 44,
    "label": "partial ↔ full",
    "detail": ""
  },
  {
    "id": "kit",
    "from": 6,
    "x": 270,
    "y": 328,
    "w": 380,
    "h": 44,
    "label": "shared scene kit",
    "detail": ""
  },
  {
    "id": "link3",
    "from": 7,
    "x": 680,
    "y": 245,
    "w": 35,
    "h": 40,
    "label": "→",
    "detail": ""
  },
  {
    "id": "verify",
    "from": 7,
    "x": 715,
    "y": 198,
    "w": 135,
    "h": 130,
    "label": "verify",
    "detail": "build · render"
  },
  {
    "id": "modify",
    "from": 8,
    "x": 500,
    "y": 145,
    "w": 260,
    "h": 50,
    "label": "",
    "detail": ""
  },
  {
    "id": "reveal",
    "from": 9,
    "x": 8,
    "y": 2,
    "w": 864,
    "h": 376,
    "label": "YOU’RE LOOKING AT ONE",
    "detail": ""
  }
];
export const visibleEntities = (beat: number) => entities.filter(e => e.from <= beat);

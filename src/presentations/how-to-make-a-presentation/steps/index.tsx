import { AnimatePresence } from "motion/react";
import { Box } from "../../../presentation-kit/nodes/Box";
import { Label } from "../../../presentation-kit/nodes/Label";
import { Arrow } from "../../../presentation-kit/nodes/Arrow";
import { Frame } from "../../../presentation-kit/nodes/Frame";
import { SymbolChip } from "../../../presentation-kit/nodes/SymbolChip";
import { Appear } from "../../../presentation-kit/nodes/Appear";
import { SceneLayer } from "../../../presentation-kit/nodes/SceneLayer";
import type { Step } from "../../../presentation-kit/types";
import { entityId } from "../entities";
import type { Entity, SampleState } from "../entities";
import outline from "../outline.json";
const additions: Entity[][] = [
  [
    {
      id: "you",
      kind: "box",
      x: 65,
      y: 50,
      w: 128,
      h: 48,
      text: "you",
      tone: "person",
    },
    {
      id: "prompt",
      kind: "chip",
      x: 65,
      y: 108,
      w: 156,
      text: "“I have a topic…”",
    },
  ],
  [
    {
      id: "skill",
      kind: "box",
      x: 650,
      y: 50,
      w: 155,
      h: 48,
      text: "the skill",
      tone: "skill",
    },
    {
      id: "conversation",
      kind: "arrow",
      x: 228,
      y: 60,
      w: 384,
      text: "← conversation →",
    },
    {
      id: "question",
      kind: "chip",
      x: 320,
      y: 20,
      w: 204,
      text: "one question at a time",
    },
  ],
  [
    {
      id: "tray",
      kind: "label",
      x: 65,
      y: 163,
      w: 400,
      text: "THE STORY · your answers, made tangible",
    },
    {
      id: "card-1",
      kind: "box",
      x: 65,
      y: 200,
      w: 125,
      h: 82,
      text: "01 · the opening\ntitle · caption\nvisual",
      tone: "card",
    },
  ],
  [
    {
      id: "card-2",
      kind: "box",
      x: 258,
      y: 200,
      w: 125,
      h: 82,
      text: "02 · the idea\ntitle · caption\nvisual",
      tone: "card",
    },
    {
      id: "card-3",
      kind: "box",
      x: 451,
      y: 200,
      w: 125,
      h: 82,
      text: "03 · the payoff\ntitle · caption\nvisual",
      tone: "card",
    },
    { id: "morph-1", kind: "arrow", x: 195, y: 223, w: 58, text: "morph →" },
    { id: "morph-2", kind: "arrow", x: 388, y: 223, w: 58, text: "morph →" },
  ],
  [
    {
      id: "ghost",
      kind: "box",
      x: 600,
      y: 200,
      w: 74,
      h: 82,
      text: "…\nyour call",
      tone: "ghost",
    },
    { id: "depth", kind: "chip", x: 65, y: 25, w: 180, text: "partial ↔ full" },
  ],
  [
    { id: "kit-plug", kind: "arrow", x: 414, y: 278, w: 16, h: 28, text: "│" },
    {
      id: "kit",
      kind: "box",
      x: 286,
      y: 303,
      w: 270,
      h: 42,
      text: "↳ shared scene kit · boxes + motion",
      tone: "socket",
    },
  ],
  [
    { id: "verify-link", kind: "arrow", x: 678, y: 225, w: 30, text: "→" },
    {
      id: "verify",
      kind: "box",
      x: 714,
      y: 200,
      w: 100,
      h: 82,
      text: "✓ verify\nbuild + render\nPASS",
      tone: "pass",
    },
  ],
  [
    {
      id: "modify",
      kind: "arrow",
      x: 225,
      y: 108,
      w: 160,
      h: 80,
      text: "↶ modify",
      tone: "modify",
    },
    {
      id: "edited",
      kind: "chip",
      x: 275,
      y: 181,
      w: 92,
      text: "edited",
      tone: "edit",
    },
  ],
  [
    {
      id: "reveal",
      kind: "frame",
      x: 14,
      y: 5,
      w: 852,
      h: 366,
      text: "AND SCENE · you’re looking at one",
      tone: "reveal",
    },
  ],
];
export const STATES: SampleState[] = additions.map((_, i) => ({
  beat: i,
  entities: additions.slice(0, i + 1).flat(),
}));
const primitives = {
  box: Box,
  label: Label,
  arrow: Arrow,
  frame: Frame,
  chip: SymbolChip,
};
export function SampleScene({ payload }: { payload: SampleState }) {
  return (
    <SceneLayer>
      <AnimatePresence>
        {payload.entities.map((e) => {
          const Node = primitives[e.kind];
          return (
            <Appear
              key={e.id}
              style={{
                position: "absolute",
                left: e.x,
                top: e.y,
                width: e.w,
                height: e.h,
              }}
            >
              <Node
                id={entityId(e.id)}
                className={`sample-entity ${e.tone || ""}`}
                style={{ width: "100%", height: "100%" }}
              >
                {e.text}
              </Node>
            </Appear>
          );
        })}
      </AnimatePresence>
    </SceneLayer>
  );
}
export const STEPS: Step<SampleState>[] = outline.map((meta, i) => ({
  ...meta,
  groupKey: "one-evolving-scene",
  Scene: SampleScene,
  payload: STATES[i],
}));

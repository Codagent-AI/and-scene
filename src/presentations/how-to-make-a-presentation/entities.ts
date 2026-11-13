export const entityId = (name: string) => `how-to-make:${name}`;
export interface Entity {
  id: string;
  kind: "box" | "label" | "arrow" | "frame" | "chip";
  x: number;
  y: number;
  w: number;
  h?: number;
  text: string;
  tone?: string;
}
export interface SampleState {
  beat: number;
  entities: Entity[];
}

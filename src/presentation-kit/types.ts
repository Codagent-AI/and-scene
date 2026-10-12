import type { ComponentType, ReactNode } from "react";
import type { HTMLMotionProps } from "motion/react";

export interface SceneProps<TPayload = unknown> {
  payload: TPayload;
  stepIndex: number;
}
export interface Step<TPayload = unknown> {
  id: string;
  era: string;
  title: string;
  caption: string;
  Scene: ComponentType<SceneProps<TPayload>>;
  payload: TPayload;
  groupKey?: string;
}
export type PresentationMode = "browse" | "present";
export type NodeProps = Omit<HTMLMotionProps<"div">, "layoutId"> & {
  entityId?: string;
  layoutId?: string;
};
export type Brand = ReactNode;

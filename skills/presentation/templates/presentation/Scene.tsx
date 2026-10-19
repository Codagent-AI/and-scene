import { Box, Emphasis, SceneLayer, Appear, Arrow, type SceneProps } from '__KIT__'
import { ID, LINK, RECTS } from './entities'

/** Diagram state for one step. Each step sets the flags it needs; the scene reads only these. */
export interface ScenePayload {
  /** The target box and the link to it are on the canvas. */
  connected: boolean
  /** The target is emphasised. */
  focused: boolean
}

/**
 * One accumulating scene shared by every step in the group. `source` is present
 * from step 1 and never re-enters; newcomers (target, link, focus) fade in via Appear.
 */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      <Box id={RECTS.source.id} x={RECTS.source.x} y={RECTS.source.y} w={RECTS.source.w} h={RECTS.source.h} label="Source" />
      <Appear when={payload.connected}>
        <Box id={RECTS.target.id} x={RECTS.target.x} y={RECTS.target.y} w={RECTS.target.w} h={RECTS.target.h} label="Target" />
        <Arrow id={ID.link} from={LINK.from} to={LINK.to} />
      </Appear>
      <Appear when={payload.focused}>
        <Emphasis id={RECTS.focus.id} x={RECTS.focus.x} y={RECTS.focus.y} w={RECTS.focus.w} h={RECTS.focus.h} />
      </Appear>
    </SceneLayer>
  )
}

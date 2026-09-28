/* eslint-disable react-refresh/only-export-components -- Step objects and their Scene live together by design. */
import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entities } from '../entities'

/**
 * Template for one new step in an existing presentation. Copy into that
 * presentation's `steps/` directory, rename `__STEP_ID__`, fill in the
 * fields below, and add it to that presentation's `steps/index.ts` in
 * viewing order. Give adjacent steps the same `groupKey` when they should
 * keep one Scene mounted (e.g. an accumulating tray) instead of remounting.
 */

/**
 * Fields this step's Scene needs. If this step shares a `groupKey` with its
 * neighbors, this is the shape that changes between them.
 */
interface __STEP_ID__Payload {
  label: string
}

function __STEP_ID__Scene({ payload }: SceneProps<__STEP_ID__Payload>) {
  return (
    <SceneLayer>
      <Box layoutId={entities.placeholder} style={{ position: 'absolute', left: 24, top: 24 }}>
        {payload.label}
      </Box>
    </SceneLayer>
  )
}

export const __STEP_ID__: Step<__STEP_ID__Payload> = {
  id: '__STEP_ID__',
  era: '__ERA__',
  // groupKey: '__GROUP_KEY__',
  title: '__STEP_TITLE__',
  caption: '__STEP_CAPTION__',
  payload: { label: '__STEP_VISUAL__' },
  Scene: __STEP_ID__Scene,
}

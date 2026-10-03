/* eslint-disable react-refresh/only-export-components -- Step objects and their Scene live together by design. */
import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entities } from '../entities'

/**
 * Fields this step's Scene needs to render. Steps sharing a `groupKey` keep
 * this Scene mounted and only swap `payload`, so this is also the contract
 * for anything that should update in place across a group.
 */
interface Step01Payload {
  label: string
}

function Step01Scene({ payload }: SceneProps<Step01Payload>) {
  return (
    <SceneLayer>
      <Box layoutId={entities.placeholder} className="__SLUG__-box" style={{ position: 'absolute', left: 24, top: 24 }}>
        {payload.label}
      </Box>
    </SceneLayer>
  )
}

export const step01: Step<Step01Payload> = {
  id: '__SLUG__-step-01',
  era: '__ERA__',
  title: '__STEP_TITLE__',
  caption: '__STEP_CAPTION__',
  payload: { label: '__STEP_VISUAL__' },
  Scene: Step01Scene,
}

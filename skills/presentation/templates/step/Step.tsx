/* A step module exports both its scene component and scene-state data. */
/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../../presentation-kit'
import { Box } from '../../../presentation-kit'

type Payload = { label: string }

function Scene({ payload }: { payload: Payload }) {
  return <div className="step-scene">
    <Box entityId="replace-with-stable-entity-id">{payload.label}</Box>
  </div>
}

export const step: Step<Payload> = {
  id: 'replace-with-stable-step-id',
  era: 'Section name',
  title: 'Short presenter title',
  caption: 'A clear browse-mode explanation of this step.',
  groupKey: 'replace-with-shared-scene-group',
  Scene,
  payload: { label: 'Replace with this step state' },
}

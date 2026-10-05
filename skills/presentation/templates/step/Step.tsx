/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../../presentation-kit'
import { Box, Label } from '../../../presentation-kit'

export interface ExamplePayload { label: string }
function ExampleScene({ payload }: { payload: ExamplePayload }) {
  return <Box entityId="stable-entity-id" className="example-node">
    <Label entityId="stable-entity-label" className="example-node__label">{payload.label}</Label>
  </Box>
}

export const exampleStep: Step<ExamplePayload> = {
  id: 'stable-step-id',
  era: 'Section name',
  title: 'Presenter title',
  caption: 'Browse caption explaining this beat.',
  payload: { label: 'Diagram state' },
  Scene: ExampleScene,
}

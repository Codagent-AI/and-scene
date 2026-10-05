/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../presentation-kit'
import { Box, Label } from '../../presentation-kit'
import { ENTITY } from './entities'

type Payload = { message: string }
function Scene({ payload }: { payload: Payload }) {
  return <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    <Box entityId={ENTITY.example} className="example-node" style={{ position: 'absolute', left: 300, top: 140, width: 280, height: 90 }}>
      <Label entityId={`${ENTITY.example}-label`} className="example-node__label">{payload.message}</Label>
    </Box>
  </div>
}

export const STEPS: readonly Step<Payload>[] = [
  { id: 'opening', era: 'Introduction', title: 'A concise presenter title', caption: 'Explain the point of this beat in a readable sentence.', payload: { message: 'The evolving scene' }, Scene },
  { id: 'development', era: 'Development', title: 'Show what changes', caption: 'Keep persistent entities stable and make the next change visible.', payload: { message: 'A changed state' }, Scene },
]

/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../../presentation-kit'
import { Box, Label, SceneLayer } from '../../../presentation-kit'
type Payload = { text: string }
function Scene({ payload }: { payload: Payload }) {
  return <SceneLayer style={{ position: 'relative', width: '100%', height: '100%' }}><Box id="example-topic" style={{ position: 'absolute', left: 320, top: 130 }}><Label>{payload.text}</Label></Box></SceneLayer>
}
export const steps: Step<Payload>[] = [{ id: 'start', era: 'Start', title: 'Your first presentation', caption: 'Replace this example with your topic.', groupKey: 'example', Scene, payload: { text: 'A scene begins here' } }]

import { AnimatePresence } from 'motion/react'
import { Box, Appear, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entityId } from '../entities'
interface State { label: string; showDetail: boolean }
function Scene({ payload }: SceneProps<State>) {
  return <SceneLayer><Box id={entityId('anchor')} style={{ position: 'absolute', left: 100, top: 100 }}>{payload.label}</Box><AnimatePresence>{payload.showDetail && <Appear key="detail" style={{ position: 'absolute', left: 400, top: 100 }}><Box id={entityId('detail')}>Detail</Box></Appear>}</AnimatePresence></SceneLayer>
}
export const STEPS: readonly Step<State>[] = [
  { id: 'opening', era: 'the idea', title: '__TITLE__', caption: 'Replace with the opening explanation.', groupKey: '__SLUG__', Scene, payload: { label: 'The idea', showDetail: false } },
  { id: 'detail', era: 'the idea', title: 'A closer look', caption: 'Replace with the next narrative beat.', groupKey: '__SLUG__', Scene, payload: { label: 'The idea develops', showDetail: true } },
]

import { AnimatePresence } from 'motion/react'
import { Appear, Label, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entities } from '../entities'

interface Payload { detail: boolean }
function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Label id={entities.topic} style={{ position: 'absolute', left: 100, top: 100 }}>Your topic</Label><AnimatePresence>{payload.detail && <Appear key={entities.detail} style={{ position: 'absolute', left: 360, top: 100 }}><Label id={entities.detail}>A new idea</Label></Appear>}</AnimatePresence></SceneLayer>
}
export const steps: Step<Payload>[] = [
  { id: 'topic', era: 'the idea', title: 'Start with a topic', caption: 'One idea anchors the scene.', groupKey: 'example', Scene, payload: { detail: false } },
  { id: 'detail', era: 'the idea', title: 'Build on the idea', caption: 'Keep the first idea and add the next detail.', groupKey: 'example', Scene, payload: { detail: true } },
]

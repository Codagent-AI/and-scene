import { motion } from 'motion/react'
import { Presentation, Box } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
type Payload = { count: number; caption: string }
const Scene = ({ payload }: SceneProps<Payload>) => <><Box entityId="box">{payload.caption}</Box><motion.div layoutId="custom">{payload.count}</motion.div></>
const steps: Step<Payload>[] = [{ id: 'one', era: 'start', title: 'Title', caption: 'Caption', groupKey: 'group', Scene, payload: { count: 1, caption: 'typed' } }]
export const Valid = <Presentation steps={steps} title="typed" />
// @ts-expect-error The host must not accept an incompatible payload.
export const Invalid = <Presentation<string> steps={steps} title="invalid" />
// @ts-expect-error Required step metadata is mandatory.
export const Missing: Step<Payload> = { Scene, payload: { count: 1, caption: 'typed' } }

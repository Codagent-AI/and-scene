import type { SceneProps } from '../../../presentation-kit/types'
interface Payload { beat: string }
export function Scene({ payload }: SceneProps<Payload>) { return <div>{payload.beat}</div> }

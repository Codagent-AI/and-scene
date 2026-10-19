// Intentionally incompatible: a grouped Scene expects { cardX: number } but the step supplies a
// different payload shape. Exports only components so the file stays a pure fixture.
import { Presentation } from '../../../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../../../src/presentation-kit/types'

interface BoardPayload {
  cardX: number
}

function Board({ payload }: SceneProps<BoardPayload>) {
  return <span>{payload.cardX}</span>
}

export function Deck() {
  const steps: Step<BoardPayload>[] = [
    { id: 'a', era: 'Start', title: 'A', caption: 'First.', groupKey: 'board', Scene: Board, payload: { label: 'wrong' } },
  ]
  return <Presentation steps={steps} title="Board" />
}

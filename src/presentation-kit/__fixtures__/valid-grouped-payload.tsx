// Compiled by `npm run build` but never bundled. A typed grouped step array must reach
// <Presentation> and SceneProps through inference alone, with no type assertions or
// type-erasing shortcuts.
import { Presentation } from '../Presentation'
import { Box } from '../nodes/Box'
import type { SceneProps, Step } from '../types'

export interface BoardPayload {
  cardX: number
  label: string
  flagged: boolean
}

export function Board({ payload, index }: SceneProps<BoardPayload>) {
  return (
    <Box id="card" x={payload.cardX} y={20} w={120} h={60} label={`${payload.label} ${index}`} emphasis={payload.flagged} />
  )
}

export function BoardDeck() {
  const boardSteps: Step<BoardPayload>[] = [
    { id: 'a', era: 'Start', title: 'A', caption: 'First.', groupKey: 'board', Scene: Board, payload: { cardX: 10, label: 'one', flagged: false } },
    { id: 'b', era: 'Start', title: 'B', caption: 'Second.', groupKey: 'board', Scene: Board, payload: { cardX: 200, label: 'two', flagged: true } },
  ]
  return <Presentation steps={boardSteps} title="Board" />
}

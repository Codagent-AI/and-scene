import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'answers',
  era: 'the gathering',
  title: "Answers become steps",
  caption: "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
  Scene: Diagram,
  payload: { beat: 3 },
  groupKey: 'htp',
}

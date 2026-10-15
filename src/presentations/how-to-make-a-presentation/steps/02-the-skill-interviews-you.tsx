import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'interview',
  era: 'the ask',
  title: "The skill interviews you",
  caption: "One question at a time: the topic, the look, then each beat of the story.",
  Scene: Diagram,
  payload: { beat: 2 },
  groupKey: 'htp',
}

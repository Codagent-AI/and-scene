import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
import './presentation.css'

// How to Use This Skill to Make a Presentation
//
// A self-referential talk about building presentations with the presentation
// skill — its closing beat reveals that the viewer is looking at an example
// of the skill's own output. One evolving scene: entities accumulate across
// all nine steps and are never rearranged or redrawn.
export default function Talk() {
  return (
    <Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
  )
}

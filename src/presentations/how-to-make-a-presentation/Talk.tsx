import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './presentation.css'
export default function Talk() {
  return <div className="how-to"><Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" brand={<aside className="scene-key" aria-label="Diagram key">
    <span>You: “I have an idea…”</span>
    <span data-from="2">You ↔ skill: what happens next?</span>
    <span data-from="3">Step cards: title · caption · visual. Links show what morphs.</span>
    <span data-from="5">You choose partial ↔ full detail; the dotted card is your call.</span>
    <span data-from="6">Shared scene kit: boxes · arrows · motion.</span>
    <span data-from="7">Verify: build + render.</span>
    <span data-from="8">Ask for a change ↶ edits the second card.</span>
    <span data-from="9">The outer frame reveals: this is the presentation.</span>
  </aside>} /></div>
}

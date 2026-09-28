import { Presentation } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
import './style.css'

interface Story { through: number }
function Scene({ payload }: SceneProps<Story>) {
  const n = payload.through
  return <div className="how-scene">
    {n >= 9 && <div className="reveal entity" data-entity-id="reveal"><span>MADE WITH THE PRESENTATION SKILL</span></div>}
    {n >= 1 && <div className="person entity" data-entity-id="you"><small>AUTHOR</small><b>You</b></div>}
    {n >= 1 && <div className="prompt entity" data-entity-id="prompt">“I have a topic…”</div>}
    {n >= 2 && <div className="skill entity" data-entity-id="skill"><small>YOUR GUIDE</small><b>Presentation skill</b></div>}
    {n >= 2 && <div className="conversation-link entity" data-entity-id="conversation">↔ <span>one question at a time</span></div>}
    {n >= 3 && <div className="tray entity" data-entity-id="tray"><span>THE STORY TAKES SHAPE</span></div>}
    {n >= 3 && <Card index={1} />}{n >= 4 && <><Card index={2} /><Card index={3} /></>}
    {n >= 5 && <><div className="ghost entity" data-entity-id="ghost">… your depth, your call</div><div className="depth entity" data-entity-id="depth">PARTIAL <span>↔</span> DETAILED</div></>}
    {n >= 6 && <><div className="kit-wire entity" data-entity-id="kit-wire"/><div className="kit entity" data-entity-id="kit"><span>SHARED SCENE KIT</span><b>Boxes · arrows · motion</b></div></>}
    {n >= 7 && <div className="verify entity" data-entity-id="verify"><small>BUILD + RENDER</small><b>✓ Checks pass</b></div>}
    {n >= 8 && <><div className="modify entity" data-entity-id="modify">↶ Ask for a change</div><div className="edited entity" data-entity-id="edited">EDITED</div></>}
  </div>
}
function Card({ index }: { index: number }) { return <article className={`story-card card-${index} entity`} data-entity-id={`step-${index}`}><small>STEP 0{index}</small><b>{index === 1 ? 'A clear title' : index === 2 ? 'A useful caption' : 'A visual beat'}</b><span>What changes in the scene?</span></article> }
const titles = ['You have a topic','The skill interviews you','Answers become steps','The deck grows','You set the depth','It assembles the scene','It checks its own work','Changed your mind? Loop it.','You’re looking at one']
const captions = [
  'It starts with you, a topic, and mild overconfidence.',
  'One question at a time: the topic, the look, then each beat of the story.',
  'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  'Same shapes, new beats. Every answer extends the story without redrawing it.',
  'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  'Before saying done, it builds and renders every step — and fixes what breaks.',
  'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  'This presentation was built exactly this way. Thanks for watching.',
]
const eras = ['the ask','the ask','the gathering','the gathering','the gathering','the build','the build','the loop','the reveal']
const steps: Step<Story>[] = titles.map((title, i) => ({ id: `beat-${i+1}`, era: eras[i], title, caption: captions[i], groupKey: 'one-evolving-scene', Scene, payload: { through: i + 1 } }))
export default function Talk() { return <Presentation steps={steps} title="How to Use This Skill to Make a Presentation" initialMode="browse" /> }

import { Appear, Presentation } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
import { entity } from './entities'
import './style.css'

interface Story { through: number }
// Every entity is introduced at one beat and then stays put, so each is an `Appear` newcomer that fades in after the scene settles.
function Scene({ payload }: SceneProps<Story>) {
  const n = payload.through
  return <div className="how-scene">
    {n >= 9 && <Appear id={entity('reveal')} className="reveal entity"><span>MADE WITH THE PRESENTATION SKILL</span></Appear>}
    {n >= 1 && <Appear id={entity('you')} className="person entity"><small>AUTHOR</small><b>You</b></Appear>}
    {n >= 1 && <Appear id={entity('prompt')} className="prompt entity">“I have a topic…”</Appear>}
    {n >= 2 && <Appear id={entity('skill')} className="skill entity"><small>YOUR GUIDE</small><b>Presentation skill</b></Appear>}
    {n >= 2 && <Appear id={entity('conversation')} className="conversation-link entity">↔ <span>one question at a time</span></Appear>}
    {n >= 3 && <Appear id={entity('tray')} className="tray entity"><span>THE STORY TAKES SHAPE</span></Appear>}
    {n >= 3 && <><Card index={1} /><CardLink index={1} morph="size" /></>}
    {n >= 4 && <><Card index={2} /><CardLink index={2} morph="label" /><Card index={3} /></>}
    {n >= 5 && <><Appear id={entity('ghost')} className="ghost entity">… your depth, your call</Appear><Appear id={entity('depth')} className="depth entity">PARTIAL <span>↔</span> DETAILED</Appear></>}
    {n >= 6 && <><Appear id={entity('kit-wire')} className="kit-wire entity" /><Appear id={entity('kit')} className="kit entity"><span>SHARED SCENE KIT</span><b>Boxes · arrows · motion</b></Appear></>}
    {n >= 7 && <Appear id={entity('verify')} className="verify entity"><small>BUILD + RENDER</small><b>✓ Checks pass</b></Appear>}
    {n >= 8 && <><Appear id={entity('modify')} className="modify entity">↶ Ask for a change</Appear><Appear id={entity('edited')} className="edited entity">EDITED</Appear></>}
  </div>
}
const cardTitles = ['A clear title', 'A useful caption', 'A visual beat']
function Card({ index }: { index: number }) {
  return <Appear id={entity(`step-${index}`)} className={`story-card card-${index} entity`}><small>STEP 0{index}</small><b>{cardTitles[index - 1]}</b><span>What changes in the scene?</span></Appear>
}
// The link from card `index` to the next one carries what morphs between the two steps, so nothing is drawn inside the cards.
function CardLink({ index, morph }: { index: number; morph: string }) {
  return <Appear id={entity(`link-${index}`)} className={`card-link link-${index} entity`}><span>{morph}</span></Appear>
}
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

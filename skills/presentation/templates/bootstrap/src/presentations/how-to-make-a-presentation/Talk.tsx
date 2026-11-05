import { AnimatePresence, motion } from 'motion/react'
import { Presentation } from '../../presentation-kit/Presentation'
import type { SceneProps, Step } from '../../presentation-kit/types'
import { ENTER_DELAY, LAYOUT_T } from '../../presentation-kit/constants'
import './style.css'
const details = [
 ['the ask','You have a topic','It starts with you, a topic, and mild overconfidence.'],
 ['the ask','The skill interviews you','One question at a time: the topic, the look, then each beat of the story.'],
 ['the gathering','Answers become steps','Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
 ['the gathering','The deck grows','Same shapes, new beats. Every answer extends the story without redrawing it.'],
 ['the gathering','You set the depth','Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
 ['the build','It assembles the scene','Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
 ['the build','It checks its own work','Before saying done, it builds and renders every step — and fixes what breaks.'],
 ['the loop','Changed your mind? Loop it.','Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
 ['the reveal',"You're looking at one",'This presentation was built exactly this way. Thanks for watching.'],
]
function Scene({ payload: n }: SceneProps<number>) {
 const item = (id: string, content: React.ReactNode, x: number, y: number, className = '', delay = false) => <motion.div key={id} layoutId={id} layout className={`scene-item ${className}`} style={{ left: x, top: y }} initial={delay ? { opacity: 0 } : false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ layout: { duration: LAYOUT_T }, opacity: { delay: delay ? ENTER_DELAY : 0 } }}>{content}</motion.div>
 return <div className="scene" data-presentation-layer>
  <svg className="connections" viewBox="0 0 880 380" aria-hidden="true">{n >= 3 && <path d="M210 280 H237" />}{n >= 5 && <path d="M307 324 V337" />}{n >= 6 && <path d="M560 280 H608" />}{n >= 7 && <path d="M670 130 C700 175 310 168 310 234" />}</svg>
  <AnimatePresence>
  {item('you', <><small>THE AUTHOR</small><strong>You</strong></>, 58, 48, 'person')}
  {item('prompt', 'I have an idea…', 204, 59, 'bubble')}
  {n >= 1 && item('skill', <><small>YOUR COLLABORATOR</small><strong>Presentation skill</strong></>, 574, 48, 'person skill', true)}
  {n >= 1 && item('question', '←  one question at a time  →', 304, 124, 'question', true)}
  {n >= 2 && item('tray-label', 'THE STORY TAKES SHAPE', 62, 207, 'tray-label', true)}
  {n >= 2 && item('card1', <><small>01 / STEP</small><b>Title</b><span>Caption · Visual</span></>, 62, 236, 'card', true)}
  {n >= 3 && item('card2', <><small>02 / STEP</small><b>New beat {n >= 7 ? '✦' : ''}</b><span>{n >= 7 ? 'Edited in place' : 'Caption · Visual'}</span></>, 237, 236, 'card', true)}
  {n >= 3 && item('morph', 'morph →', 193, 278, 'morph', true)}
  {n >= 4 && item('card3', <><small>03 / STEP</small><b>More to come</b><span>Partial or full</span></>, 412, 236, 'card ghost', true)}
  {n >= 4 && item('depth', 'partial  ◉────  full', 57, 153, 'depth', true)}
  {n >= 5 && item('kit', '◇  SHARED SCENE KIT', 232, 337, 'kit', true)}
  {n >= 6 && item('verify', <><small>CHECKS</small><b>Build + render</b><span>✓ PASS</span></>, 608, 236, 'card verify', true)}
  {n >= 7 && item('modify', '↳ modify a step in place', 467, 190, 'modify', true)}
  {n >= 8 && item('frame', 'AN AND-SCENE PRESENTATION', 15, 10, 'reveal', true)}
  </AnimatePresence>
 </div>
}
const steps: Step<number>[] = details.map(([era,title,caption], i) => ({ id: `step-${i+1}`, era, title, caption, Scene, payload: i, groupKey: 'story' }))
export default function Talk() { return <Presentation title="How to Use This Skill to Make a Presentation" steps={steps} /> }

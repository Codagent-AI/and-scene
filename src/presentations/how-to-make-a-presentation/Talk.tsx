import { AnimatePresence, motion } from 'motion/react'
import { Presentation, type Step } from '../../presentation-kit'
import './style.css'
const titles = ['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"]
const captions = ['It starts with you, a topic, and mild overconfidence.', 'One question at a time: the topic, the look, then each beat of the story.', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', 'Same shapes, new beats. Every answer extends the story without redrawing it.', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', 'Before saying done, it builds and renders every step — and fixes what breaks.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', 'This presentation was built exactly this way. Thanks for watching.']
const eras = ['the ask','the ask','the gathering','the gathering','the gathering','the build','the build','the loop','the reveal']
function Scene({payload: n}: {payload: number}) {
  const item = (key: string, at: number, className: string, content: React.ReactNode) => n >= at && <motion.div key={key} layoutId={key} className={className} initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} transition={{duration:.3, delay:.45}}>{content}</motion.div>
  return <div className="diagram"><AnimatePresence>
    {item('you', 0, 'entity you', <><b>YOU</b><span>the storyteller</span></>)}
    {item('prompt', 0, 'prompt', '“I have a topic.”')}
    {item('skill', 1, 'entity skill', <><b>THE SKILL</b><span>your creative partner</span></>)}
    {item('connection', 1, 'connection', <><small>one question at a time</small>←────────→</>)}
    {item('tray-base', 2, 'tray-base', '')}
    {item('tray', 2, 'tray-label', 'THE STORY, STEP BY STEP')}
    {item('card1', 2, 'card card-one', <><small>01 / STEP</small><b>Title</b><span>Caption · Visual</span></>)}
    {item('link1', 3, 'card-link link-one', 'morph →')}
    {item('link2', 3, 'card-link link-two', 'morph →')}
    {item('card2', 3, 'card card-two', <><small>02 / STEP</small><b>Next beat</b><span>Caption · Visual</span></>)}
    {item('card3', 3, 'card card-three', <><small>03 / STEP</small><b>And then…</b><span>the story grows</span></>)}
    {item('ghost', 4, 'card ghost', <>more to come <span>partial ↔ full</span></>)}
    {item('depth', 4, 'depth', 'partial ↔ full')}
    {item('kit', 5, 'kit', '⊕  SHARED SCENE KIT · boxes, arrows, motion')}
    {item('verify-link', 6, 'verify-link', '→')}
    {item('verify', 6, 'verify', <>✓ <b>VERIFY</b><span>build + render pass</span></>)}
    {item('modify', 7, 'modify', <><svg viewBox="0 0 330 100" aria-hidden="true"><path d="M 300 5 C 280 70, 110 0, 50 95" fill="none" stroke="currentColor" strokeWidth="2" markerEnd="url(#modify-arrow)"/><defs><marker id="modify-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L0 6 L6 3 Z" fill="currentColor"/></marker></defs></svg><span>MODIFY IN PLACE</span></>)}
    {item('edited', 7, 'edited', 'edited ↗')}
    {item('frame', 8, 'reveal', <span>THIS IS THE SCENE</span>)}
  </AnimatePresence></div>
}
const STEPS: Step<number>[] = titles.map((title, i) => ({id: `step-${i+1}`, era: eras[i], title, caption: captions[i], Scene, payload: i, groupKey: 'story'}))
export default function Talk() { return <Presentation title="How to Use This Skill to Make a Presentation" steps={STEPS} /> }

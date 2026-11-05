import { type Step, type SceneProps } from '../../../presentation-kit'
import { AnimatePresence, motion } from 'motion/react'
import { entities } from '../entities'
const content: [string, number, string, string, string][] = [
 ['topic',0,'the ask','You have a topic','It starts with you, a topic, and mild overconfidence.'],
 ['interview',1,'the ask','The skill interviews you','One question at a time: the topic, the look, then each beat of the story.'],
 ['answers',2,'the gathering','Answers become steps','Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
 ['growth',3,'the gathering','The deck grows','Same shapes, new beats. Every answer extends the story without redrawing it.'],
 ['depth',4,'the gathering','You set the depth','Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
 ['assembly',5,'the build','It assembles the scene','Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
 ['verification',6,'the build','It checks its own work','Before saying done, it builds and renders every step — and fixes what breaks.'],
 ['revision',7,'the loop','Changed your mind? Loop it.','Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
 ['reveal',8,'the reveal',"You're looking at one",'This presentation was built exactly this way. Thanks for watching.'],
]
// The step table exports data alongside its scene component.
// eslint-disable-next-line react-refresh/only-export-components
function Scene({payload: n}: SceneProps<number>) {
 const item = (id: string, text: React.ReactNode, x: number, y: number, cls = '') => <motion.div layoutId={id} key={id} className={`scene-item ${cls}`} style={{left:x, top:y}} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{delay:.55, duration:.3, layout:{duration:.5}}}>{text}</motion.div>
 return <div className="diagram"><AnimatePresence>
 {item(entities.you,<><small>THE START</small><strong>You</strong></>,70,40,'person')}
 {item(entities.prompt,<>“I have a topic…”</>,275,52,'bubble')}
 {n >= 1 && <>{item(entities.skill,<><small>YOUR CREATIVE PARTNER</small><strong>Presentation skill</strong></>,600,40,'person skill')}{item(entities.question,'←  one question at a time  →',315,106,'question')}</>}
 {n >= 2 && <>{item(entities.tray,'',60,190,'tray')}{item(entities.tray_label,'THE STORY TAKES SHAPE',72,170,'eyebrow')}{item(entities.card_1,<><small>01 / STEP</small><b>Title</b><span>Caption · visual</span></>,72,203,'card')}</>}
 {n >= 3 && <>{item(entities.card_2,<><small>02 / STEP</small><b>Next beat</b><span>Same scene</span></>,235,203,'card')}{item(entities.morph,'title →',197,185,'connector')}{item(entities.morph_2,'visual →',360,185,'connector')}{item(entities.card_3,<><small>03 / STEP</small><b>And another</b><span>Keep building</span></>,398,203,'card')}</>}
 {n >= 4 && <>{item(entities.ghost,<><small>YOUR PACE</small><b>More?</b><span>Sketch or specify</span></>,561,203,'card ghost')}{item(entities.depth,'PARTIAL  ↔  FULL',75,128,'depth')}</>}
 {n >= 5 && item(entities.kit,'▦  SHARED SCENE KIT  /  boxes · arrows · motion',190,329,'kit')}
 {n >= 6 && item(entities.verify,<><small>VERIFY</small><b>✓ Pass</b><span>build + render</span></>,724,203,'card verify')}
 {n >= 7 && <><motion.svg key="modify-arc" className="modify-arc" viewBox="0 0 280 130" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{delay:.55}}><path d="M270 5 C270 85 140 60 25 120" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5"/><path d="M25 120 l4 -12 m-4 12 l12 -1" fill="none" stroke="currentColor" strokeWidth="2"/></motion.svg>{item(entities.loop,'MODIFY A STEP',438,150,'loop')}{item(entities.edit,'✳ EDITED',403,186,'edit')}</>}
 {n >= 8 && <motion.div layoutId={entities.reveal} className="reveal" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.55}}><span>THIS IS THE SCENE YOU'RE WATCHING</span></motion.div>}
 </AnimatePresence></div>
}
export const steps: Step<number>[] = content.map(([id,payload,era,title,caption]) => ({id, era, title, caption, Scene, payload, groupKey:'story'}))

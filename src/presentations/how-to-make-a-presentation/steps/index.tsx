/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../../presentation-kit'
import { ids } from '../entities'
type Payload = { showSkill: boolean; showQuestion: boolean; partial: boolean; visibleCards: number; ghost: boolean; kit: boolean; verify: boolean; modify: boolean; reveal: boolean }
function Scene({ payload }: { payload: Payload }) {
  return <div className="howto-scene">
    <div className="howto-conversation"><div className="howto-person" data-scene-entity={ids.you}><span>YOU</span><b>you</b></div><div className="howto-dialogue"><div className="howto-prompt" data-scene-entity={ids.prompt}>“I have a topic…”</div>{payload.showQuestion && <div className="howto-link"><span className="howto-question" data-scene-entity={ids.question}>one question at a time</span><i>↔</i></div>}</div>{payload.showSkill && <div className="howto-person skill" data-scene-entity={ids.skill}><span>✳</span><b>skill</b></div>}</div>
    {payload.partial && <div className="howto-partial" data-scene-entity="howto-partial">partial ↔ full</div>}
    {payload.modify && <div className="howto-modify" data-scene-entity={ids.modify}>↘ modify a step</div>}
    <div className="howto-route"><div className="howto-tray" data-scene-entity={ids.tray}>{ids.cards.slice(0, payload.visibleCards).map((id, index) => <article className={`howto-card ${index === 2 && payload.modify ? 'edited' : ''}`} data-scene-entity={id} key={id}><small>STEP 0{index + 1}</small><b>{index === 0 ? 'Title · Caption · Visual' : ['title', 'caption', 'visual', 'motion', 'build', 'reveal'][index]}</b><span>{index === 0 ? 'A clear beat' : index === 1 ? 'What to understand' : index === 2 ? 'What appears' : index === 3 ? 'What persists' : index === 4 ? 'Check the work' : 'Close the loop'}</span></article>)}{payload.ghost && <article className="howto-card ghost" data-scene-entity="howto-ghost"><small>…</small><b>your pace</b><span>fill in as much as you like</span></article>}{payload.verify && <div className="howto-verify" data-scene-entity={ids.verify}><b>✓</b><span>BUILD + RENDER<br/><strong>all clear</strong></span></div>}</div>{payload.kit && <div className="howto-kit" data-scene-entity={ids.kit} data-allow-overlap><i>↓</i><b>SCENE KIT</b><span>shared boxes · arrows · motion</span></div>}</div>
    {payload.reveal && <div className="howto-frame" data-scene-entity={ids.reveal}><span>MADE WITH THIS SKILL</span></div>}
  </div>
}
const beats = [
['the ask','You have a topic','It starts with you, a topic, and mild overconfidence.',{showSkill:false,showQuestion:false,partial:false,visibleCards:0,ghost:false,kit:false,verify:false,modify:false,reveal:false}],
['the ask','The skill interviews you','One question at a time: the topic, the look, then each beat of the story.',{showSkill:true,showQuestion:true,partial:false,visibleCards:0,ghost:false,kit:false,verify:false,modify:false,reveal:false}],
['the gathering','Answers become steps','Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',{showSkill:true,showQuestion:true,partial:false,visibleCards:1,ghost:false,kit:false,verify:false,modify:false,reveal:false}],
['the gathering','The deck grows','Same shapes, new beats. Every answer extends the story without redrawing it.',{showSkill:true,showQuestion:true,partial:false,visibleCards:3,ghost:false,kit:false,verify:false,modify:false,reveal:false}],
['the gathering','You set the depth','Spell out every step, or sketch a few and see how it looks. You hold the gate.',{showSkill:true,showQuestion:true,partial:true,visibleCards:3,ghost:true,kit:false,verify:false,modify:false,reveal:false}],
['the build','It assembles the scene','Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',{showSkill:true,showQuestion:true,partial:true,visibleCards:4,ghost:true,kit:true,verify:false,modify:false,reveal:false}],
['the build','It checks its own work','Before saying done, it builds and renders every step — and fixes what breaks.',{showSkill:true,showQuestion:true,partial:true,visibleCards:4,ghost:true,kit:true,verify:true,modify:false,reveal:false}],
['the loop','Changed your mind? Loop it.','Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',{showSkill:true,showQuestion:true,partial:true,visibleCards:4,ghost:true,kit:true,verify:true,modify:true,reveal:false}],
['the reveal',"You're looking at one",'This presentation was built exactly this way. Thanks for watching.',{showSkill:true,showQuestion:true,partial:true,visibleCards:4,ghost:true,kit:true,verify:true,modify:true,reveal:true}],
] as const
export const STEPS: readonly Step<Payload>[] = beats.map(([section,title,caption,payload], index) => ({ id:`how-to-${index+1}`,section,title,caption,payload:payload as Payload,scene:Scene,groupKey:'how-to-evolving-scene' }))

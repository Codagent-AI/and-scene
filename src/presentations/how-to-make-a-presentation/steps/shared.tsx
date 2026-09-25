import { Fragment } from 'react'
import type { SceneProps } from '../../../presentation-kit'
import { Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import '../style.css'
export type StoryPayload={beat:number}
const cards=['topic','interview','answers → steps','deck grows','set depth','assemble scene','verify','modify','reveal']
export function StoryScene({payload:{beat}}:SceneProps<StoryPayload>){const show=(n:number)=>beat>=n;const cardCount=beat<2?0:beat===2?1:cards.length
 return <SceneLayer className="howto-scene">
  <Box entityId="howto-you" className="howto-node howto-you">YOU</Box><Box entityId="howto-prompt" className="howto-node howto-prompt">A topic</Box>
  {show(1)&&<Fragment key="interview"><Box entityId="howto-skill" className="howto-node howto-skill">SKILL</Box><Arrow entityId="howto-question-arrow" className="howto-arrow" from="you" to="skill"/><SymbolChip entityId="howto-question" className="howto-chip">one question at a time</SymbolChip></Fragment>}
  {show(2)&&<div className="howto-tray"><Label entityId="howto-tray" className="howto-tray-label">ONE ROUTE · EACH ANSWER ADDS A STEP</Label>{cards.slice(0,cardCount).map((label,i)=><Box key={label} entityId={`howto-step-card-${i}`} className={`howto-card howto-card-${i}`}>{String(i+1).padStart(2,'0')}<br/>{label}</Box>)}<Label entityId="howto-morph-label" className="howto-morph">stable entities · layout morph · deliberate exits</Label></div>}
  {show(4)&&<Fragment key="depth"><Box entityId="howto-ghost" className="howto-node howto-ghost">… open step</Box><Box entityId="howto-depth" className="howto-node howto-depth">partial ↔ full</Box></Fragment>}
  {show(5)&&<Fragment key="kit"><Box entityId="howto-kit" className="howto-node howto-kit">SCENE KIT</Box><Arrow entityId="howto-kit-arrow" className="howto-arrow" from="kit" to="tray"/></Fragment>}
  {show(6)&&<Fragment key="verification"><Box entityId="howto-verify" className="howto-node howto-verify">BUILD + RENDER ✓</Box><Arrow entityId="howto-verify-arrow" className="howto-arrow" from="tray" to="verify"/></Fragment>}
  {show(7)&&<Fragment key="modify"><Box entityId="howto-modify" className="howto-node howto-modify">↶ MODIFY IN PLACE</Box></Fragment>}
  {show(8)&&<div className="howto-reveal" data-presentation-allow-overlap=""><Frame entityId="howto-frame" className="howto-frame"><span>THIS PRESENTATION IS ONE</span></Frame></div>}
 </SceneLayer>
}

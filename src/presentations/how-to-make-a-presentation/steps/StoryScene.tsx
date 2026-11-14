import { AnimatePresence } from 'motion/react'
import { UserRound, Sparkles, Check, Boxes } from 'lucide-react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Label } from '../../../presentation-kit/nodes/Label'
import { SymbolChip } from '../../../presentation-kit/nodes/SymbolChip'
import { Frame } from '../../../presentation-kit/nodes/Frame'
import { Emphasis } from '../../../presentation-kit/nodes/Emphasis'
import { Arrow } from '../../../presentation-kit/nodes/Arrow'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { entities, entityId } from '../entities'
import type { EntityId } from '../entities'
import type { SceneProps } from '../../../presentation-kit/types'
import type { StoryPayload } from './index'
export function StoryScene({ payload: { beat } }: SceneProps<StoryPayload>) {
  const content: Record<EntityId, React.ReactNode> = {
    you: <><UserRound size={21} /><strong>you</strong></>, prompt: <>“I have a topic…”</>,
    skill: <><Sparkles size={20} /><strong>the skill</strong></>, question: <>One question at a time</>,
    conversation: null, tray: <span className="tray-label">YOUR STORY / ONE EVOLVING SCENE</span>,
    card1: <><b>01 / the idea</b><span>Title</span><span>Caption</span><span className="visual-line">▣ Visual</span></>,
    card2: <><b>02 / the next beat</b><span>Title</span><span>Caption</span><span className="visual-line">▣ Visual</span></>,
    card3: <><b>03 / the payoff</b><span>Title</span><span>Caption</span><span className="visual-line">▣ Visual</span></>,
    link1: null, link2: null, ghost: <><span>…</span><small>your call</small></>, depth: <>partial ⟷ full</>,
    kit: <><Boxes size={18} /> shared scene kit · boxes, arrows, motion</>,
    verify: <><Check size={22} /><b>PASS</b><small>build + render</small></>, verifyLink: null,
    modify: null, edited: <>↺ edited</>, reveal: <span>AND SCENE — YOU’RE LOOKING AT ONE</span>,
  }
  return <SceneLayer><AnimatePresence>{(Object.keys(entities) as EntityId[]).filter(id => entities[id].from <= beat).map(id => {
    const entity = entities[id]
    const style = { position: 'absolute' as const, left: entity.x, top: entity.y, width: entity.w, height: entity.h }
    const shared = { id: entityId(id), className: `story-${id}`, style }
    let node
    if (id === 'conversation') node = <Arrow {...shared} viewBox="0 0 416 20" d="M 0 10 H 416" both />
    else if (id === 'link1' || id === 'link2') node = <div style={style} className="morph-link"><Arrow id={entityId(id)} viewBox="0 0 46 20" d="M 0 10 H 46" /><small>morphs</small></div>
    else if (id === 'verifyLink') node = <Arrow {...shared} viewBox="0 0 30 20" d="M 0 10 H 30" />
    else if (id === 'modify') node = <div style={style} className="modify-arc"><Arrow id={entityId(id)} viewBox="0 0 365 66" d="M 0 0 C 15 65 320 -5 320 66" /><span>ask → edit in place</span></div>
    else if (id === 'reveal') node = <Frame {...shared}>{content[id]}</Frame>
    else if (id === 'edited') node = <Emphasis {...shared}>{content[id]}</Emphasis>
    else if (id === 'prompt' || id === 'question') node = <Label {...shared}>{content[id]}</Label>
    else if (id === 'depth' || id === 'kit') node = <SymbolChip {...shared}>{content[id]}</SymbolChip>
    else node = <Box {...shared}>{content[id]}</Box>
    return <Appear key={id}>{node}</Appear>
  })}</AnimatePresence></SceneLayer>
}

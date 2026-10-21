import { AnimatePresence } from 'motion/react'
import { Bot, Check, Flag, MessageCircleQuestion, Plug, ToggleRight, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SymbolChip } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { AT, ID, INTRODUCED_AT } from './entities'
import type { EntityId } from './entities'

export interface DiagramPayload {
  /** Zero-based step index; entities introduced at or before it are shown. */
  stage: number
}

function CardParts({ children }: { children: ReactNode }) {
  return (
    <>
      <strong>{children}</strong>
      <span>title</span>
      <span>caption</span>
      <span>visual</span>
    </>
  )
}

/** One persistent scene: later steps only change `payload.stage`. */
export function DiagramScene({ payload }: SceneProps<DiagramPayload>) {
  const { stage } = payload
  const items: Array<[EntityId, ReactNode]> = [
    ['you', <Box key="you" id={ID.you} at={AT.you} Icon={User}>you</Box>],
    ['prompt', <Label key="prompt" id={ID.prompt} at={AT.prompt}>prompt: my topic</Label>],
    ['skill', <Box key="skill" id={ID.skill} at={AT.skill} Icon={Bot}>skill</Box>],
    ['ask', <Arrow key="ask" id={ID.ask} from={[170, 86]} to={[710, 86]} bidirectional />],
    ['question', <SymbolChip key="question" id={ID.question} at={AT.question} Icon={MessageCircleQuestion}>question</SymbolChip>],
    ['tray', <Box key="tray" id={ID.tray} at={AT.tray} data-presentation-tray />],
    ['route', <Label key="route" id={ID.route} at={AT.route}>route</Label>],
    ['card1', <Box key="card1" id={ID.card1} at={AT.card1} data-presentation-card><CardParts>step 1</CardParts></Box>],
    ['link1', <Arrow key="link1" id={ID.link1} from={[150, 214]} to={[206, 214]} />],
    ['link1Label', <Label key="l1" id={ID.link1Label} at={AT.link1Label}>morphs</Label>],
    ['card2', <Box key="card2" id={ID.card2} at={AT.card2} data-presentation-card><CardParts>step 2</CardParts></Box>],
    ['card3', <Box key="card3" id={ID.card3} at={AT.card3} data-presentation-card><CardParts>step 3</CardParts></Box>],
    ['link2', <Arrow key="link2" id={ID.link2} from={[326, 214]} to={[382, 214]} />],
    ['link2Label', <Label key="l2" id={ID.link2Label} at={AT.link2Label}>morphs</Label>],
    ['ghost', <Box key="ghost" id={ID.ghost} at={AT.ghost} data-presentation-ghost>not specified yet</Box>],
    ['link3', <Arrow key="link3" id={ID.link3} from={[502, 214]} to={[558, 214]} />],
    ['depth', <SymbolChip key="depth" id={ID.depth} at={AT.depth} Icon={ToggleRight}>partial ↔ full</SymbolChip>],
    ['socket', <Box key="socket" id={ID.socket} at={AT.socket} Icon={Plug} data-presentation-socket>scene kit: boxes, arrows, motion</Box>],
    ['plug', <Arrow key="plug" id={ID.plug} from={[266, 264]} to={[266, 272]} />],
    ['verify', <Box key="verify" id={ID.verify} at={AT.verify} data-presentation-verify><strong>verify</strong><span>build</span><span>render</span></Box>],
    ['link4', <Arrow key="link4" id={ID.link4} from={[678, 214]} to={[734, 214]} />],
    ['pass', <SymbolChip key="pass" id={ID.pass} at={AT.pass} Icon={Check} data-presentation-state="pass">pass</SymbolChip>],
    ['modify', <Arrow key="modify" id={ID.modify} from={[780, 114]} to={[310, 162]} bend={40} />],
    ['modifyLabel', <Label key="ml" id={ID.modifyLabel} at={AT.modifyLabel}>modify</Label>],
    ['flag', <Emphasis key="flag" id={ID.flag} at={AT.flag} />],
    ['edited', <SymbolChip key="edited" id={ID.edited} at={AT.edited} Icon={Flag}>edited</SymbolChip>],
    ['frame', <Frame key="frame" id={ID.frame} at={AT.frame} label="This presentation was made this way" />],
  ]
  return (
    <>
      <AnimatePresence initial={false}>
        {items
          .filter(([id]) => INTRODUCED_AT[id] <= stage)
          .map(([id, node]) => (
            <Appear key={id} data-presentation-entity={id}>
              {node}
            </Appear>
          ))}
      </AnimatePresence>
    </>
  )
}

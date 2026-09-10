import { Check, MessageCircle, Pencil, Sparkles, WandSparkles } from 'lucide-react'
import type { SceneProps } from '../../../presentation-kit/types'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { Arrow } from '../../../presentation-kit/nodes/Arrow'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Frame } from '../../../presentation-kit/nodes/Frame'
import { Label } from '../../../presentation-kit/nodes/Label'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { SymbolChip } from '../../../presentation-kit/nodes/SymbolChip'
import { entities } from '../entities'
import type { SamplePayload } from './model'

const CARD_NAMES = ['title', 'caption', 'visual', 'morphs', 'route']

function StepCard({ index }: { index: number }) {
  return <Appear className={`sample-card-enter sample-card-enter-${index}`}><Box layoutId={entities.cards[index]} className={`sample-step-card sample-step-card-${index}`}><span className="sample-card-number">0{index + 1}</span><span>{CARD_NAMES[index]}</span></Box></Appear>
}

export function HowToScene({ payload }: SceneProps<SamplePayload>) {
  const beat = payload.beat
  const cards = beat >= 3 ? (beat === 3 ? 1 : beat === 4 ? 4 : 5) : 0
  return <SceneLayer className="how-to-scene">
    <Box layoutId={entities.you} className="sample-node sample-you" Icon={MessageCircle}>you</Box>
    {beat >= 1 ? <Appear><SymbolChip layoutId={entities.prompt} className="sample-prompt">a topic</SymbolChip></Appear> : null}
    {beat >= 2 ? <Appear><Box layoutId={entities.skill} className="sample-node sample-skill" Icon={WandSparkles}>skill</Box></Appear> : null}
    {beat >= 2 ? <Appear><Arrow layoutId={entities.conversation} className="sample-conversation" /></Appear> : null}
    {beat >= 2 ? <Appear><SymbolChip layoutId={entities.question} className="sample-question">one question at a time</SymbolChip></Appear> : null}
    {beat >= 3 ? <Appear><Label layoutId={entities.tray} className="sample-tray-label">the evolving scene</Label></Appear> : null}
    {Array.from({ length: cards }, (_, index) => <StepCard key={entities.cards[index]} index={index} />)}
    {Array.from({ length: Math.max(0, cards - 1) }, (_, index) => <Appear key={entities.cardLinks[index]}><Arrow layoutId={entities.cardLinks[index]} className={`sample-card-link sample-card-link-${index}`} /></Appear>)}
    {beat >= 5 ? <Appear><Box layoutId={entities.depth} className="sample-depth">partial <span>↔</span> full</Box></Appear> : null}
    {beat >= 5 ? <Appear><Box layoutId={`${entities.cards[4]}:ghost`} className="sample-ghost-card">unspecified</Box></Appear> : null}
    {beat >= 6 ? <Appear><Box layoutId={entities.kit} className="sample-kit" Icon={Sparkles}>shared scene kit</Box></Appear> : null}
    {beat >= 6 ? <Appear><Arrow layoutId={`${entities.kit}:plug`} className="sample-kit-plug" /></Appear> : null}
    {beat >= 7 ? <Appear><Box layoutId={entities.verify} className="sample-verify" Icon={Check}>verify <b>PASS</b></Box></Appear> : null}
    {beat >= 7 ? <Appear><Arrow layoutId={entities.verifyLink} className="sample-verify-link" /></Appear> : null}
    {beat >= 8 ? <div data-presentation-allow-overlap><Appear><Arrow layoutId={entities.modify} className="sample-modify-arc" /></Appear><Appear><SymbolChip layoutId={entities.edited} className="sample-edited" Icon={Pencil}>edited</SymbolChip></Appear></div> : null}
    {beat >= 9 ? <div data-presentation-allow-overlap><Appear><Frame layoutId={entities.reveal} className="sample-reveal"><span>you’re looking at one</span></Frame></Appear></div> : null}
  </SceneLayer>
}

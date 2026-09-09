import { Arrow, Appear, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../../presentation-kit'
import { entities } from '../entities'

export type ScenePayload = { readonly beat: number }

const cardLabels = ['01  ask', '02  look', '03  beat', '04  iterate'] as const

function Card({ index }: { index: number }) {
  return (
    <Box layoutId={[entities.cardOne, entities.cardTwo, entities.cardThree, entities.cardFour][index]} className={`sample-card sample-card-${index}`}>
      <strong>{cardLabels[index]}</strong>
      <span>{index === 0 ? 'title · caption · visual' : index === 1 ? 'same shapes, new beat' : index === 2 ? 'scene + motion' : 'review + refine'}</span>
    </Box>
  )
}

export function Scene({ payload }: SceneProps<ScenePayload>) {
  const { beat } = payload
  const cards = beat >= 4 ? 4 : beat >= 3 ? 1 : 0

  return (
    <SceneLayer className="sample-scene">
      <Box layoutId={entities.you} className="sample-you"><span className="sample-kicker">YOU</span><strong>topic</strong></Box>
      {beat >= 1 ? <Appear><Box layoutId={entities.prompt} className="sample-prompt">“Make this make sense.”</Box></Appear> : null}

      {beat >= 2 ? <Appear><Box layoutId={entities.skill} className="sample-skill"><span className="sample-kicker">SKILL</span><strong>asks, then builds</strong></Box></Appear> : null}
      {beat >= 2 ? <Arrow layoutId={entities.conversation} className="sample-conversation">↔</Arrow> : null}
      {beat >= 2 ? <Appear><SymbolChip layoutId={entities.question} className="sample-question">one question at a time</SymbolChip></Appear> : null}

      {beat >= 3 ? <Appear><Label layoutId={entities.tray} className="sample-tray-label">YOUR STORY, AS A SCENE</Label></Appear> : null}
      {beat >= 3 ? <Arrow layoutId={`${entities.tray}:rule`} className="sample-tray-rule" /> : null}
      {Array.from({ length: cards }, (_, index) => <Appear key={index}><Card index={index} /></Appear>)}

      {beat >= 5 ? <Appear><Box layoutId={entities.ghost} className="sample-ghost">? <span>open beat</span></Box></Appear> : null}
      {beat >= 5 ? <Appear><SymbolChip layoutId={entities.depth} className="sample-depth">partial ↔ full</SymbolChip></Appear> : null}

      {beat >= 6 ? <Appear><Box layoutId={entities.socket} className="sample-socket">scene kit <span>boxes · arrows · motion</span></Box></Appear> : null}
      {beat >= 6 ? <Arrow layoutId={`${entities.socket}:plug`} className="sample-plug">⌁</Arrow> : null}

      {beat >= 7 ? <Appear><Arrow layoutId={`${entities.verify}:chain`} className="sample-chain" data-allow-overlap>→</Arrow></Appear> : null}
      {beat >= 7 ? <Appear><Box layoutId={entities.verify} className="sample-verify">verify <span>build + render</span></Box></Appear> : null}
      {beat >= 7 ? <Appear><Emphasis layoutId={entities.pass} className="sample-pass">✓ pass</Emphasis></Appear> : null}

      {beat >= 8 ? <Appear><Arrow layoutId={entities.modify} className="sample-modify" data-allow-overlap>↙</Arrow></Appear> : null}
      {beat >= 8 ? <Appear><Emphasis layoutId={entities.flag} className="sample-flag" data-allow-overlap>edit this</Emphasis></Appear> : null}

      {beat >= 9 ? <Appear><Frame layoutId={entities.reveal} className="sample-reveal" data-allow-overlap><span>THIS IS THE OUTPUT</span></Frame></Appear> : null}
    </SceneLayer>
  )
}

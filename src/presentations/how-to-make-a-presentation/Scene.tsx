import type { ReactNode } from 'react'
import { Check, MessageCircleQuestion, Pencil, Puzzle, User, Wand2 } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { ARROWS, ENTITIES } from './entities'
import type { SamplePayload } from './types'

/**
 * Entities introduced after the first step enter through `Appear`; it keeps wrapping
 * them for as long as they stay on screen, so they never remount, and it only plays
 * its fade when the entity mounts. The opening entities are rendered bare.
 */
const enters = (since: number) => since > 1

function CardParts() {
  return (
    <>
      <span data-part="title">title</span>
      <span data-part="caption">caption</span>
      <span data-part="visual">visual</span>
    </>
  )
}

export function Scene({ payload }: SceneProps<SamplePayload>) {
  const step = payload.step
  const on = (since: number) => step >= since
  const wrap = (key: string, since: number, node: ReactNode) =>
    enters(since) ? <Appear key={`appear:${key}`}>{node}</Appear> : node
  const E = ENTITIES

  return (
    <SceneLayer>
        {on(E.you.since) &&
          wrap('you', E.you.since, (
            <Box key="you" id={E.you.id} at={E.you.at} Icon={User}>
              you
            </Box>
          ))}
        {on(E.prompt.since) &&
          wrap('prompt', E.prompt.since, (
            <Label key="prompt" id={E.prompt.id} at={E.prompt.at}>
              prompt
            </Label>
          ))}
        {on(E.skill.since) &&
          wrap('skill', E.skill.since, (
            <Box key="skill" id={E.skill.id} at={E.skill.at} Icon={Wand2}>
              skill
            </Box>
          ))}
        {on(ARROWS.talk.since) &&
          wrap('talk', ARROWS.talk.since, (
            <Arrow key="talk" id={ARROWS.talk.id} from={[...ARROWS.talk.from]} to={[...ARROWS.talk.to]} twoWay />
          ))}
        {on(E.question.since) &&
          wrap('question', E.question.since, (
            <SymbolChip key="question" id={E.question.id} at={E.question.at} Icon={MessageCircleQuestion} />
          ))}
        {on(E.tray.since) &&
          wrap('tray', E.tray.since, (
            <Label key="tray" id={E.tray.id} at={E.tray.at} data-presentation-variant="tray">
              step cards
            </Label>
          ))}
        {on(E.card1.since) &&
          wrap('card1', E.card1.since, (
            <Box key="card1" id={E.card1.id} at={E.card1.at} data-presentation-variant="step-card">
              <CardParts />
            </Box>
          ))}
        {on(E.card2.since) &&
          wrap('card2', E.card2.since, (
            <Box key="card2" id={E.card2.id} at={E.card2.at} data-presentation-variant="step-card">
              <CardParts />
            </Box>
          ))}
        {on(E.card3.since) &&
          wrap('card3', E.card3.since, (
            <Box key="card3" id={E.card3.id} at={E.card3.at} data-presentation-variant="step-card">
              <CardParts />
            </Box>
          ))}
        {on(ARROWS.link1.since) &&
          wrap('links', ARROWS.link1.since, (
            [
              <Arrow key="link1" id={ARROWS.link1.id} from={[...ARROWS.link1.from]} to={[...ARROWS.link1.to]} />,
              <Arrow key="link2" id={ARROWS.link2.id} from={[...ARROWS.link2.from]} to={[...ARROWS.link2.to]} />,
              <SymbolChip key="morph1" id={E.morph1.id} at={E.morph1.at} symbol="~" />,
              <SymbolChip key="morph2" id={E.morph2.id} at={E.morph2.at} symbol="~" />,
            ]
          ))}
        {on(E.ghost.since) &&
          wrap('ghost', E.ghost.since, (
            <Box key="ghost" id={E.ghost.id} at={E.ghost.at} data-presentation-variant="ghost-card">
              <span>unspecified</span>
            </Box>
          ))}
        {on(E.depth.since) &&
          wrap('depth', E.depth.since, (
            <Emphasis key="depth" id={E.depth.id} at={E.depth.at} on>
              partial ↔ full
            </Emphasis>
          ))}
        {on(E.kit.since) &&
          wrap('kit', E.kit.since, (
            <Box key="kit" id={E.kit.id} at={E.kit.at} Icon={Puzzle} data-presentation-variant="socket">
              scene kit
            </Box>
          ))}
        {on(E.verify.since) &&
          wrap('verify', E.verify.since, (
            [
              <Arrow key="chain" id={ARROWS.chain.id} from={[...ARROWS.chain.from]} to={[...ARROWS.chain.to]} />,
              <Box key="verify" id={E.verify.id} at={E.verify.at} data-presentation-variant="verify">
                <span>build + render</span>
              </Box>,
              <SymbolChip key="pass" id={E.pass.id} at={E.pass.at} Icon={Check} data-presentation-variant="pass" />,
            ]
          ))}
        {on(E.route.since) &&
          wrap('route', E.route.since, (
            [
              <Label key="route" id={E.route.id} at={E.route.at}>
                /how-to-make-a-presentation
              </Label>,
              <Arrow
                key="modify"
                id={ARROWS.modify.id}
                from={[...ARROWS.modify.from]}
                to={[...ARROWS.modify.to]}
                bend={[...ARROWS.modify.bend]}
              />,
              <SymbolChip key="edited" id={E.edited.id} at={E.edited.at} Icon={Pencil} symbol="edited" />,
            ]
          ))}
        {on(E.reveal.since) &&
          wrap('reveal', E.reveal.since, (
            [
              <Frame key="reveal" id={E.reveal.id} at={E.reveal.at} data-presentation-allow-overlap="" />,
              <Label key="reveal-label" id={E.revealLabel.id} at={E.revealLabel.at}>
                built with this skill
              </Label>,
            ]
          ))}
    </SceneLayer>
  )
}

import { motion } from 'motion/react'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entity } from '../entities'
import { SceneReadingGuide } from './SceneReadingGuide'

const at = (left: number, top: number) => ({ left, top })

const cards = [
  { x: 100, name: 'Step A', detail: 'Title · caption · visual', first: 3 },
  { x: 243, name: 'Step B', detail: 'The next beat', first: 4 },
  { x: 386, name: 'Step C', detail: 'A new state', first: 4 },
] as const

const links = [
  { x: 218, name: 'ab', first: 4 },
  { x: 361, name: 'bc', first: 4 },
  { x: 504, name: 'cd', first: 5 },
  { x: 647, name: 'dv', first: 7 },
] as const

export function BuildScene({ payload: beat }: SceneProps<number>) {
  return <SceneLayer className="build-diagram">
    <SceneReadingGuide key="reading-guide" beat={beat} />
    <Box key="you" id={entity('you')} className="participant" data-compact-label="You" style={at(106, 76)}>
      <strong>You</strong><span>Bring an idea</span>
    </Box>
    <Label key="prompt" id={entity('prompt')} className="diagram-label prompt" data-compact-chip="…" style={at(106, 39)}>
      <span>“Help me explain this.”</span>
    </Label>
    {beat >= 2 && <Box key="skill" id={entity('skill')} enter
      className="participant participant-skill" data-compact-label="Skill" style={at(586, 76)}>
      <strong>Presentation skill</strong><span>Ask, then assemble</span>
    </Box>}
    {beat >= 2 && <Arrow key="conversation" id={entity('conversation')} enter
      className="diagram-line" style={at(294, 99)} width={286} height={16} path="M 2 8 H 284" bidirectional />}
    {beat >= 2 && <SymbolChip key="question" id={entity('question')} enter
      className="diagram-label question" data-compact-chip="?" style={at(365, 69)}>
      <span>One question at a time</span>
    </SymbolChip>}
    {beat >= 3 && <Box key="tray" id={entity('tray')} enter
      className="step-tray" style={at(84, 192)} />}
    {cards.map(({ x, name, detail, first }) => beat >= first &&
      <Box key={name} id={entity(name)} enter className="step-card" data-compact-label={name.slice(-1)} style={at(x, 200)}>
        <strong>{name}</strong><span>{detail}</span>
        {beat >= 8 && name === 'Step B' && <Emphasis id={entity('edited')} enter
          className="diagram-label edited" data-compact-chip="!"><span>Edited</span></Emphasis>}
      </Box>)}
    {links.map(({ x, name, first }) => beat >= first &&
      <Arrow key={name} id={entity(name)} enter className="diagram-line"
        style={at(x, 225)} width={23} height={14} path="M 1 7 H 22" />)}
    {beat >= 4 && <Label key="morph" id={entity('morph')} enter
      className="diagram-label morph" data-compact-chip="Δ" style={at(141, 164)}>
      <span>Position · label</span>
    </Label>}
    {beat >= 5 && <Box key="ghost" id={entity('ghost')} enter
      className="step-card ghost" data-compact-label="…" style={at(529, 200)}><strong>Step …</strong><span>Unspecified</span></Box>}
    {beat >= 5 && <SymbolChip key="depth" id={entity('depth')} enter
      className="diagram-label depth" data-compact-chip="↔" style={at(106, 135)}>
      <span>Partial ↔ full</span>
    </SymbolChip>}
    {beat >= 6 && <Box key="kit" id={entity('kit')} enter className="scene-socket" data-compact-label="Kit" style={at(345, 278)}>
      <strong>Shared scene kit</strong><span>Boxes · arrows · motion</span>
    </Box>}
    {beat >= 7 && <Box key="verify" id={entity('verify')} enter
      className="step-card verify-node" data-compact-label="✓" style={at(674, 200)}>
      <strong>Verify <motion.span className="pass-check" aria-label="passed"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62, duration: 0.08 }}>
        ✓
      </motion.span></strong><span>Build + render</span>
    </Box>}
    {beat >= 8 && <Arrow key="modify-arc" id={entity('modify-arc')} enter
      className="diagram-line modify-line" style={at(303, 111)} width={284} height={88}
      path="M 282 2 C 264 53 98 33 14 87" />}
    {beat >= 8 && <Label key="modify" id={entity('modify')} enter
      className="diagram-label modify" data-compact-chip="↶" style={at(420, 146)}>
      <span>Request an edit</span>
    </Label>}
    {beat >= 9 && <Frame key="reveal" id={entity('reveal')} enter
      className="reveal-frame" style={at(31, 23)}>
      <span>Made exactly this way</span>
    </Frame>}
  </SceneLayer>
}

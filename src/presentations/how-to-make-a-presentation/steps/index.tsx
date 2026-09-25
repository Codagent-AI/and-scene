/* eslint-disable react-refresh/only-export-components */
import { Fragment } from 'react'
import type { Step, SceneProps } from '../../../presentation-kit/types'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import { entity } from '../entities'
import { beats } from '../beats.mjs'
import '../presentation.css'

type Payload = { beat: number }

// Step cards reuse the titles of the first five beats.
const cardContent = [
  ['01', 'title · caption · visual'],
  ['02', 'questions become answers'],
  ['03', 'one scene, shared kit'],
  ['04', 'same shapes · new beats'],
  ['05', 'partial or complete'],
].map(([number, detail], index) => ({ number, title: beats[index][1], detail }))

function Scene({ payload: { beat } }: SceneProps<Payload>) {
  const cardCount = Math.min(beat - 1, 4)
  const currentCard = beat >= 7 ? 1 : beat - 2
  return <SceneLayer className="sample-scene">
    <Box key={entity('you')} id={entity('you')} className="person you"><span className="eyebrow">YOUR SIDE</span><strong>You</strong><small>one good topic</small>{beat >= 4 && <SymbolChip id={entity('depth-control')} className="depth-control">◐ partial ↔ full</SymbolChip>}</Box>
    <Box key={entity('prompt')} id={entity('prompt')} className="prompt"><span className="eyebrow">THE ASK</span><strong>“How do I explain this?”</strong></Box>
    {beat >= 1 && <Fragment key={entity('interview')}>
      <Arrow id={entity('conversation')} className="conversation-arrow">↔</Arrow>
      <Box id={entity('skill')} className="person skill"><span className="eyebrow">YOUR GUIDE</span><strong>Skill</strong><small>asks, listens, shapes</small></Box>
      <SymbolChip id={entity('question')} className="question-chip">one question at a time</SymbolChip>
    </Fragment>}
    {beat >= 2 && <div key={entity('route')} className="route" data-presentation-route="">
      {cardContent.slice(0, cardCount).map(({ number, title, detail }, index) => <div className="card-slot" key={number}>
        <Box id={entity(`step-${number}`)} className={`step-card ${index === currentCard ? 'current-card' : ''}`}>
          <span className="card-number">{number}</span><strong>{title}</strong><small>{detail}</small>
        </Box>
        {index < cardCount - 1 && <div className="card-link"><Arrow id={entity(`link-${number}`)}>→</Arrow><small>morph</small></div>}
      </div>)}
      {beat >= 4 && <Box id={entity('ghost')} className="step-card ghost-card"><span className="card-number">…</span><strong>Next beat</strong><small>still yours to shape</small></Box>}
      {beat >= 5 && <>
        <Label id={entity('kit-label')} className="kit-label">THE SHARED SCENE KIT</Label>
        <SymbolChip id={entity('kit-socket')} className="kit-socket">◈ ready-made boxes · arrows · motion</SymbolChip>
      </>}
      {beat >= 6 && <Box id={entity('verify')} className="verify-node"><strong>✓</strong><span>BUILD + RENDER PASS</span></Box>}
      {beat >= 7 && <>
        <Emphasis id={entity('modify-arc')} className="modify-arc">↶ change a beat, keep the scene</Emphasis>
        <Label id={entity('edited')} className="edited-flag">EDITED IN PLACE</Label>
      </>}
    </div>}
    {beat >= 8 && <Frame key={entity('reveal-frame')} id={entity('reveal-frame')} className="reveal-frame"><Label id={entity('reveal-label')}>A PRESENTATION MADE WITH THIS SKILL</Label></Frame>}
  </SceneLayer>
}

export const steps: Step<Payload>[] = beats.map(([era, title, caption], index) => ({
  id: `step-${index + 1}`, era, title, caption, groupKey: 'evolving-sample-scene', Scene, payload: { beat: index },
}))

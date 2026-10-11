import { AnimatePresence } from 'motion/react';
import { UserRound, Sparkles, MessageCircle, Layers, Check, Wrench, HelpCircle } from 'lucide-react';
import { Appear, Arrow, Box, Frame, Label, SymbolChip } from '../../../presentation-kit';
import type { SceneProps } from '../../../presentation-kit';
import { entities as e } from '../entities';

export interface SceneState { beat: number }
export function EvolvingScene({ payload }: SceneProps<SceneState>) {
  const { beat } = payload;
  return <div className="making-scene">
    <AnimatePresence>
      <Appear key="you"><Box id={e.you} Icon={UserRound} className="person node-you"><strong>you</strong><span>the storyteller</span></Box></Appear>
      <Appear key="prompt"><Label id={e.prompt} Icon={MessageCircle} className="prompt">“I have a topic…”</Label></Appear>
      {beat >= 2 && <Appear key="conversation">
        <Box id={e.skill} Icon={Sparkles} className="person node-skill"><strong>skill</strong><span>your scene partner</span></Box>
        <Arrow id={e['you-skill-link']} className="conversation-link"><span>↔</span></Arrow>
        <SymbolChip id={e['question-chip']} Icon={HelpCircle} className="question">one question at a time</SymbolChip>
      </Appear>}
      {beat >= 3 && <Appear key="tray">
        <Label id={e.tray} className="tray">THE STORY / YOUR STEPS</Label>
        <Box id={e['card-1']} className="step-card card-one"><b>01 / the start</b><span>title</span><span>caption</span><span>visual</span></Box>
      </Appear>}
      {beat >= 4 && <Appear key="more-cards">
        <Box id={e['card-2']} className="step-card card-two"><b>02 / the turn</b><span>title</span><span>caption</span><span>visual</span></Box>
        <Box id={e['card-3']} className="step-card card-three"><b>03 / the payoff</b><span>title</span><span>caption</span><span>visual</span></Box>
        <Arrow id={e['card-link-1']} className="card-link link-one"><small>morph</small><span>→</span></Arrow>
        <Arrow id={e['card-link-2']} className="card-link link-two"><small>morph</small><span>→</span></Arrow>
      </Appear>}
      {beat >= 5 && <Appear key="depth">
        <Box id={e['ghost-card']} className="step-card ghost-card"><b>… / your call</b><span>what comes</span><span>next?</span></Box>
        <SymbolChip id={e['depth-control']} className="depth-control">partial ↔ full</SymbolChip>
      </Appear>}
      {beat >= 6 && <Appear key="kit"><Box id={e['scene-kit-socket']} Icon={Layers} className="kit-socket"><strong>shared scene kit</strong><span>boxes · arrows · motion</span></Box></Appear>}
      {beat >= 7 && <Appear key="verification">
        <Arrow id={e['verify-link']} className="verify-link">→</Arrow>
        <Box id={e['verify-node']} className="step-card verify-node"><b>verify</b><span>build + render</span><SymbolChip id={e['verify-pass']} Icon={Check} className="verify-pass">pass</SymbolChip></Box>
      </Appear>}
      {beat >= 8 && <Appear key="loop">
        <Arrow id={e['modify-arc']} className="modify-arc"><svg viewBox="0 0 880 380" aria-label="Modify this step in place"><path d="M 710 145 Q 720 177 610 177 L 490 177 L 490 206" /><path d="m 484 197 6 9 6 -9" /></svg><span><Wrench size={17}/> edit in place</span></Arrow>
        <SymbolChip id={e['edited-flag']} className="edited-flag">edited</SymbolChip>
      </Appear>}
      {beat >= 9 && <Appear key="reveal">
        <Frame id={e['reveal-frame']} className="reveal-frame" />
        <Label id={e['reveal-label']} className="reveal-label">AND SCENE. / YOU’RE LOOKING AT ONE.</Label>
      </Appear>}
    </AnimatePresence>
  </div>;
}

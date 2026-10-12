import { ArrowRight, ArrowLeftRight, Check, CircleHelp, Code2, FileCheck2, Pencil, UserRound, WandSparkles } from "lucide-react";
import { Appear, Box, Frame, Label, SymbolChip } from "../../../presentation-kit";
import type { SceneProps } from "../../../presentation-kit";
import { entity } from "../entities";

export interface StoryPayload { stage: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }
const cardData = [
  ["01 / ASK", "You have a topic", "Topic, visual, and story beat."],
  ["02 / ASK", "The skill interviews you", "One question at a time."],
  ["03 / GATHER", "Answers become steps", "Title, caption, and visual."],
  ["04 / GATHER", "The deck grows", "New beats join the story."],
  ["05 / GATHER", "You set the depth", "A sketch can be enough."],
];

export function Scene({ payload: { stage } }: SceneProps<StoryPayload>) {
  const visibleCards = stage < 3 ? 0 : stage < 4 ? 1 : stage < 5 ? 3 : 4;
  return (
    <div className="story-scene" data-stage={stage}>
      {stage === 9 && <Frame className="reveal-frame" entityId={entity.frame} layoutId={entity.frame}><span>THE SCENE MAKES ITS POINT</span></Frame>}
      <Label className="conversation-label" entityId="conversation-label">A CONVERSATION, THEN A SCENE</Label>
      <Box className="scene-node you-node" entityId={entity.you} layoutId={entity.you}><UserRound size={18} /><span>you</span></Box>
      <Box className="prompt-bubble" entityId={entity.prompt} layoutId={entity.prompt}><span>“I have a topic…”</span><i /></Box>
      {stage >= 2 && <>
        <Box className="scene-node skill-node" entityId={entity.skill} layoutId={entity.skill}><WandSparkles size={18} /><span>the skill</span></Box>
        <ArrowRight className="conversation-arrow forward" aria-hidden="true" />
        <ArrowLeftRight className="conversation-arrow return" aria-hidden="true" />
        <Appear><SymbolChip className="question-chip"><CircleHelp size={13} /> one question at a time</SymbolChip></Appear>
      </>}
      {stage >= 3 && <>
        <Label className="route-caption" entityId="route-caption">ONE ROUTE · EACH BEAT ADDS A PIECE</Label>
        <div className="card-tray" data-entity-id={entity.tray}>
          {cardData.slice(0, visibleCards).map(([number, title, caption], index) => (
            <Box className={`step-card ${stage >= 8 && index === 2 ? "edited" : ""}`} entityId={entity.card(index)} layoutId={entity.card(index)} key={number}>
              <span className="card-number">{number}</span><strong>{title}</strong><small>{caption}</small>
              <span className="visual-token"><span /><span /><span /></span>
              {stage >= 8 && index === 2 && <span className="edit-flag">EDITED</span>}
            </Box>
          ))}
          {stage >= 5 && <Appear><Box className="step-card ghost-card" entityId={entity.card(5)} layoutId={entity.card(5)}><span className="card-number">… / LATER</span><strong>Space to explore</strong><small>More detail when you need it</small><span className="visual-token"><span /><span /></span></Box></Appear>}
        </div>
        {visibleCards > 1 && <div className="morph-link">what morphs <ArrowRight size={13} /></div>}
      </>}
      {stage >= 5 && <Appear><div className="depth-control"><span>YOU SET THE DEPTH</span><b>sketch</b><span className="depth-track" /><b>full</b></div></Appear>}
      {stage >= 6 && <Appear><div className="kit-socket"><Code2 size={15} /><span>SCENE KIT</span><small>shared motion + parts</small></div></Appear>}
      {stage >= 7 && <Appear><div className="verify-node"><FileCheck2 size={17} /><span>build + render</span><b><Check size={13} /> PASS</b></div></Appear>}
      {stage >= 8 && <Appear><div className="modify-arc"><Pencil size={13} /><span>ask → adjust in place</span></div></Appear>}
      {stage === 9 && <Label className="reveal-label" entityId="reveal-label">A PRESENTATION BUILT BY ITS OWN STORY ↗</Label>}
    </div>
  );
}

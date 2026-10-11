import { Bot, Check, Plug, ShieldCheck, User } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, Presence, SceneLayer, SymbolChip } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { cardEntity, entity } from './entities'

/** `beat` is the 1-based step number. The scene is one evolving diagram: each beat only adds to it. */
export type Payload = { beat: number }

/** Newcomers wait for continuing entities to settle (the kit's ENTER_DELAY is 0.55s), then stagger. */
const SETTLED = 0.55
const LATE = SETTLED + 0.35

function StepCard({ n, flagged = false }: { n: number; flagged?: boolean }) {
  const id = cardEntity(n)
  return (
    <Box id={id} className={flagged ? 'card card--edited' : 'card'}>
      <div className="card-head">
        <Label id={`${id}:name`}>Step {n}</Label>
        {flagged && (
          <Appear id={`${id}:flag`} className="card-flag">
            <SymbolChip id={`${id}:edited`} className="chip chip--coral">edited</SymbolChip>
          </Appear>
        )}
      </div>
      {(['title', 'caption', 'visual'] as const).map((part) => (
        <div key={part} className="part">
          <Label id={`${id}:${part}`}>{part}</Label>
          <i className={part === 'visual' ? 'bar bar--visual' : 'bar'} />
        </div>
      ))}
    </Box>
  )
}

export function Scene({ payload }: SceneProps<Payload>) {
  const { beat } = payload
  const at = (n: number) => beat >= n
  return (
    <SceneLayer id="how-to-make-a-presentation">
      {/* 1-2: the conversation row anchors the top */}
      {at(1) && (
        <Appear id={entity('you')} className="pos e-you">
          <Box id={entity('you')} className="node node--you" Icon={User}><Label id={entity('you:label')}>you</Label></Box>
        </Appear>
      )}
      {at(1) && (
        <Appear id={entity('prompt')} className="pos e-prompt" delay={LATE}>
          <Box id={entity('prompt')} className="bubble"><Label id={entity('prompt:label')}>make me a talk about…</Label></Box>
        </Appear>
      )}
      {at(2) && (
        <Appear id={entity('skill')} className="pos e-skill">
          <Box id={entity('skill')} className="node node--skill" Icon={Bot}><Label id={entity('skill:label')}>skill</Label></Box>
        </Appear>
      )}
      {at(2) && (
        <Appear id={entity('conversation')} className="pos e-conv" delay={LATE}>
          <Arrow id={entity('conversation')} className="line line--two"><i /></Arrow>
        </Appear>
      )}
      {at(2) && (
        <Appear id={entity('question')} className="pos e-question" delay={LATE + 0.2}>
          <SymbolChip id={entity('question')} className="chip">which topic?</SymbolChip>
        </Appear>
      )}

      {/* 3-5: a tray of step cards accumulates below */}
      {at(3) && (
        <Appear id={entity('tray')} className="pos e-tray">
          {/* The tray is a soft shelf that the cards sit on, so the overlap is intentional. */}
          <Box id={entity('tray')} className="tray" data-presentation-allow-overlap="" />
        </Appear>
      )}
      {at(3) && <Appear id={cardEntity(1)} className="pos e-card1" delay={LATE}><StepCard n={1} /></Appear>}
      {at(4) && <Appear id={cardEntity(2)} className="pos e-card2"><StepCard n={2} flagged={at(8)} /></Appear>}
      {at(4) && (
        <Appear id={entity('link-1')} className="pos e-link1" delay={LATE}><Arrow id={entity('link-1')} className="line line--link" /></Appear>
      )}
      {at(4) && (
        <Appear id={entity('morph-1')} className="pos e-morph1 center" delay={LATE}><SymbolChip id={entity('morph-1')} className="chip chip--small">morph</SymbolChip></Appear>
      )}
      {at(4) && <Appear id={cardEntity(3)} className="pos e-card3" delay={LATE}><StepCard n={3} /></Appear>}
      {at(4) && (
        <Appear id={entity('link-2')} className="pos e-link2" delay={LATE + 0.2}><Arrow id={entity('link-2')} className="line line--link" /></Appear>
      )}
      {at(4) && (
        <Appear id={entity('morph-2')} className="pos e-morph2 center" delay={LATE + 0.2}><SymbolChip id={entity('morph-2')} className="chip chip--small">morph</SymbolChip></Appear>
      )}
      {at(5) && (
        <Appear id={entity('ghost')} className="pos e-ghost">
          <Box id={entity('ghost')} className="card card--ghost">
            <Label id={entity('ghost:label')}>unspecified</Label>
            <Label id={entity('ghost:hint')}>step</Label>
          </Box>
        </Appear>
      )}
      {at(5) && (
        <Appear id={entity('link-3')} className="pos e-link3" delay={LATE}><Arrow id={entity('link-3')} className="line line--link line--dashed" /></Appear>
      )}
      {at(5) && (
        <Appear id={entity('depth')} className="pos e-control" delay={LATE}>
          <Box id={entity('depth')} className="control">
            <Label id={entity('depth:partial')}>partial</Label>
            <SymbolChip id={entity('depth:swap')} className="swap">↔</SymbolChip>
            <Label id={entity('depth:full')}>full</Label>
          </Box>
        </Appear>
      )}

      {/* 6-7: the scene kit plugs in, then verification joins the tray row */}
      {at(6) && (
        <Appear id={entity('kit')} className="pos e-socket">
          <Box id={entity('kit')} className="socket" Icon={Plug}>
            <Label id={entity('kit:label')}>shared scene kit</Label>
            <Label id={entity('kit:parts')} className="sub">boxes · arrows · motion</Label>
          </Box>
        </Appear>
      )}
      {at(7) && (
        <Appear id={entity('link-4')} className="pos e-link4"><Arrow id={entity('link-4')} className="line line--link" /></Appear>
      )}
      {at(7) && (
        <Appear id={entity('verify')} className="pos e-verify" delay={LATE}>
          <Box id={entity('verify')} className="card card--verify">
            <div className="verify-body">
              <div className="verify-title"><ShieldCheck aria-hidden="true" /><Label id={entity('verify:label')}>verify</Label></div>
              <div className="verify-chips">
                <SymbolChip id={entity('verify:build')} className="chip chip--small">build</SymbolChip>
                <SymbolChip id={entity('verify:render')} className="chip chip--small">render</SymbolChip>
              </div>
            </div>
            <Appear id={entity('verify:pass')} className="pass" delay={LATE + 0.6}><Check aria-hidden="true" /></Appear>
          </Box>
        </Appear>
      )}

      {/* 8: an edit loops back from the conversation into the route */}
      {at(8) && (
        <Appear id={entity('modify')} className="pos e-arc" delay={LATE}>
          <Arrow id={entity('modify')} className="arc" />
        </Appear>
      )}
      {at(8) && (
        <Appear id={entity('modify:chip')} className="pos e-modify center" delay={LATE + 0.2}>
          <SymbolChip id={entity('modify:chip')} className="chip chip--coral">edit step 2</SymbolChip>
        </Appear>
      )}
      {/* The highlight ring is the only entity that departs: it fades out when the reveal frame draws. */}
      <Presence>
        {beat === 8 && (
          <Emphasis
            key="ring"
            id={entity('ring')}
            className="pos e-ring ring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: LATE + 0.2 } }}
            exit={{ opacity: 0 }}
          />
        )}
      </Presence>

      {/* 9: a frame draws around everything already on screen */}
      {at(9) && (
        <Frame id={entity('frame')} className="frame" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: SETTLED } }}>
          <Label id={entity('frame:label')} className="frame-label">an example of the skill’s own output</Label>
        </Frame>
      )}
    </SceneLayer>
  )
}

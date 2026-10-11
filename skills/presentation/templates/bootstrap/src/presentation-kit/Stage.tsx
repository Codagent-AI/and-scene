import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { DESIGN_W, DESIGN_H, EASE, ENTER_T, STAGE_LAYOUT } from './constants';
import type { PresentationMode, Step } from './types';
import { SceneLayer } from './nodes/SceneLayer';
import { useFitScale } from './useFitScale';
import { getSceneKey } from './sceneKey';
export function Stage<T>({ steps, index, mode, width = DESIGN_W, height = DESIGN_H }: {
    steps: readonly Step<T>[];
    index: number;
    mode: PresentationMode;
    width?: number;
    height?: number;
}) {
    const scale = useFitScale(mode, width, height);
    const step = steps[index];
    const Scene = step.Scene;
    const geometry = STAGE_LAYOUT[mode];
    return <div data-presentation-stage style={{ position: 'absolute', top: geometry.top, bottom: geometry.bottom, left: geometry.horizontal / 2, right: geometry.horizontal / 2, overflow: 'hidden' }}>
    <div data-presentation-canvas style={{ position: 'absolute', width, height, left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${scale})` }}>
      <LayoutGroup><AnimatePresence initial={false} mode="sync"><motion.div key={getSceneKey(steps, index)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, ease: EASE }} style={{ position: 'absolute', inset: 0 }}><SceneLayer><Scene payload={step.payload} step={step}/></SceneLayer></motion.div></AnimatePresence></LayoutGroup>
    </div>
  </div>;
}

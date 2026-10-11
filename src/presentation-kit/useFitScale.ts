import { useEffect, useState } from 'react';
import { DESIGN_W, DESIGN_H, MIN_SCALE, STAGE_LAYOUT } from './constants';
import type { PresentationMode } from './types';
export function calculateFitScale(width: number, height: number, mode: PresentationMode, designWidth = DESIGN_W, designHeight = DESIGN_H) {
    const geometry = STAGE_LAYOUT[mode];
    return Math.max(MIN_SCALE, Math.min(1, (width - geometry.horizontal) / designWidth, (height - geometry.top - geometry.bottom) / designHeight));
}
export function useViewport() {
    const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
    useEffect(() => { const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight }); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);
    return viewport;
}
export function useFitScale(mode: PresentationMode, width = DESIGN_W, height = DESIGN_H) {
    const viewport = useViewport();
    return calculateFitScale(viewport.width, viewport.height, mode, width, height);
}

import type { ReactNode } from 'react';
import type { PresentationMode, Step } from './types';
import { usePresentationNav } from './usePresentationNav';
import { useViewport } from './useFitScale';
import { TOC_MIN_WIDTH } from './constants';
import { Stage } from './Stage';
import { Header } from './chrome/Header';
import { Footer } from './chrome/Footer';
import { Toc } from './chrome/Toc';
export interface PresentationProps<T> {
    steps: readonly Step<T>[];
    initialMode?: PresentationMode;
    title?: string;
    brand?: ReactNode;
    attribution?: false | {
        href: string;
        label: string;
    };
    width?: number;
    height?: number;
    className?: string;
}
export function Presentation<T>({ steps, initialMode, title, brand, attribution, width, height, className }: PresentationProps<T>) {
    const nav = usePresentationNav(steps.length, initialMode);
    const viewport = useViewport();
    if (!steps.length)
        return <div data-presentation-root data-presentation-mode={nav.mode} data-step-count={0}>No steps</div>;
    const step = steps[nav.index];
    return <main className={className} aria-label={title} data-presentation-root data-presentation-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index} data-step-id={step.id} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd}>
    <Header step={step} index={nav.index} brand={brand}/>
    {nav.mode === 'browse' && viewport.width >= TOC_MIN_WIDTH && <Toc steps={steps} index={nav.index} jump={nav.jump}/>}
    <Stage steps={steps} index={nav.index} mode={nav.mode} width={width} height={height}/>
    <Footer steps={steps} index={nav.index} mode={nav.mode} jump={nav.jump} next={nav.next} prev={nav.prev}/>
    <button data-presentation-mode-toggle aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`} onClick={nav.toggleMode}>Mode</button>
    {attribution !== false && <a data-presentation-attribution style={{ position: 'absolute', right: 0, bottom: 0 }} href={attribution?.href ?? 'https://github.com/Codagent-AI/and-scene'}>{attribution?.label ?? 'made by and-scene'}</a>}
  </main>;
}

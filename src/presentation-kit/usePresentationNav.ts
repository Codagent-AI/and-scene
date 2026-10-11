import { useCallback, useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import type { PresentationMode } from './types';
const INTERACTIVE = 'button,a,input,select,textarea,summary,iframe,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"],[role="textbox"],[role="checkbox"],[role="radio"],[role="switch"],[role="slider"],[role="spinbutton"],[role="combobox"],[role="listbox"],[role="option"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"],[role="searchbox"],[role="scrollbar"],[role="grid"],[role="treegrid"],[role="tree"],[role="menu"],[role="menubar"],[role="radiogroup"],[role="tablist"],[role="toolbar"],[role="tab"],[role="treeitem"],[role="gridcell"],[tabindex]:not([tabindex="-1"])';
export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
    const [index, setIndex] = useState(0);
    const [mode, setMode] = useState(initialMode);
    const clamp = useCallback((value: number) => Math.max(0, Math.min(count - 1, value)), [count]);
    const jump = useCallback((value: number) => setIndex(clamp(value)), [clamp]);
    const next = useCallback(() => setIndex(value => clamp(value + 1)), [clamp]);
    const prev = useCallback(() => setIndex(value => clamp(value - 1)), [clamp]);
    const toggleMode = useCallback(() => setMode(value => value === 'browse' ? 'present' : 'browse'), []);
    useEffect(() => {
        const keydown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || (event.target instanceof Element && event.target.closest(INTERACTIVE)))
                return;
            if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) {
                event.preventDefault();
                next();
            }
            else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
                event.preventDefault();
                prev();
            }
            else if (event.key.toLowerCase() === 'p') {
                event.preventDefault();
                toggleMode();
            }
        };
        window.addEventListener('keydown', keydown);
        return () => window.removeEventListener('keydown', keydown);
    }, [next, prev, toggleMode]);
    const touch = useRef<{
        x: number;
        y: number;
    } | null>(null);
    const onTouchStart = (event: TouchEvent) => { const point = event.touches[0]; touch.current = point ? { x: point.clientX, y: point.clientY } : null; };
    const onTouchEnd = (event: TouchEvent) => { const point = event.changedTouches[0]; const start = touch.current; touch.current = null; if (!point || !start)
        return; const dx = point.clientX - start.x; const dy = point.clientY - start.y; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0)
            next();
        else
            prev();
    } };
    return { index: clamp(index), mode, next, prev, jump, toggleMode, onTouchStart, onTouchEnd };
}

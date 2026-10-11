import type { Step } from './types';
export function getSceneKey<T>(steps: readonly Step<T>[], index: number) {
    const active = steps[index];
    let start = index;
    if (active.groupKey)
        while (start > 0 && steps[start - 1].groupKey === active.groupKey && steps[start - 1].Scene === active.Scene)
            start--;
    return `${start}:${steps[start].id}`;
}

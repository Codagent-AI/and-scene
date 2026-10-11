import type { ComponentType } from 'react';
export interface PresentationEntry {
    slug: string;
    title: string;
    load: () => Promise<{
        default: ComponentType;
    }>;
}
// Add explicit literal slugs and imports here so registration remains reviewable.
export const presentations: PresentationEntry[] = [];

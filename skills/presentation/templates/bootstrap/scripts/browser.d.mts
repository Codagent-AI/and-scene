import type { Browser, Page } from 'playwright'
export function build(): Promise<void>
export function withPreview(run: (browser: Browser, url: string) => Promise<void>): Promise<void>
export function walk(page: Page, url: string, slug: string, inspect: (page: Page, index: number, count: number) => Promise<void>): Promise<void>

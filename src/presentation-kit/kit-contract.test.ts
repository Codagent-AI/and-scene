import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W } from './constants'
import type { Step } from './types'

describe('scene kit contract', () => {
  it('uses the default fixed canvas dimensions', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  })

  it('keeps source style neutral and framework independent', () => {
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const path = join(dir, entry.name)
      return entry.isDirectory() ? walk(path) : (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx') ? [path] : []
    })
    const source = walk(join(process.cwd(), 'src/presentation-kit')).map(path => readFileSync(path, 'utf8')).join('\n')
    expect(source).not.toMatch(/\b(?:#[0-9a-f]{3,8}|rgba?\(|hsla?\(|font-family|box-shadow|border-radius|tailwind)\b/i)
  })

  it('keeps typed payloads intact at the Presentation boundary', () => {
    type TypedPayload = { count: number }
    const TypedScene = () => null
    const typedSteps: Step<TypedPayload>[] = [{ id: 'typed', era: 'Era', title: 'Title', caption: 'Caption', payload: { count: 1 }, Scene: TypedScene }]
    const accepted: typeof typedSteps = typedSteps
    expect(accepted[0].payload.count).toBe(1)
  })
})

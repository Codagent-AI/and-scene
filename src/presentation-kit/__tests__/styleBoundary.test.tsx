// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { cwd } from 'node:process'
import { render } from '@testing-library/react'
import { Bot } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Presentation } from '../Presentation'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../index'
import type { Step } from '../types'
import { ALLOWED_STYLE, FORBIDDEN_IN_SOURCE, kitSourceFiles } from './styleRules'

// Vitest runs from the repository root.
const REPO_ROOT = cwd()
const KIT_ROOT = join(REPO_ROOT, 'src/presentation-kit')

describe('style boundary (source contract)', () => {
  it('scans every non-test kit source file for visual declarations and style imports', () => {
    const files = kitSourceFiles(KIT_ROOT)
    expect(files.length).toBeGreaterThan(10)
    const violations: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      for (const pattern of FORBIDDEN_IN_SOURCE) {
        if (pattern.test(text)) violations.push(`${relative(REPO_ROOT, file)} matches ${pattern}`)
      }
    }
    expect(violations).toEqual([])
  })

  it('declares no styling framework dependency for the root app', () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as Record<string, Record<string, string>>
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    expect(Object.keys(deps).filter((name) => /tailwind|@tailwindcss/.test(name))).toEqual([])
  })
})

function everyStyleProperty(root: HTMLElement): { tag: string; prop: string }[] {
  const found: Array<{ tag: string; prop: string }> = []
  for (const element of [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]) {
    for (const prop of Array.from(element.style)) found.push({ tag: element.tagName, prop })
  }
  return found
}

describe('style boundary (rendered output)', () => {
  it('renders every primitive and chrome part with only layout and geometry inline styles', () => {
    const steps: Step<{ text: string }>[] = [
      {
        id: 'only',
        era: 'one',
        title: 'Only',
        caption: 'Only caption',
        groupKey: 'g',
        Scene: ({ payload }) => (
          <SceneLayer name="all">
            <Box style={{ left: 0, top: 0, width: 80, height: 40 }} Icon={Bot}>
              {payload.text}
            </Box>
            <Label style={{ left: 0, top: 50, width: 80, height: 20 }}>label</Label>
            <Frame style={{ left: 0, top: 80, width: 80, height: 80 }}>frame</Frame>
            <Emphasis style={{ left: 90, top: 0, width: 80, height: 40 }}>emphasis</Emphasis>
            <SymbolChip symbol="s" Icon={Bot} style={{ left: 90, top: 50, width: 80, height: 20 }}>
              chip
            </SymbolChip>
            <Arrow from={{ x: 0, y: 200 }} to={{ x: 100, y: 200 }} bidirectional />
            <Appear>
              <span>entry</span>
            </Appear>
          </SceneLayer>
        ),
        payload: { text: 'payload' },
      },
    ]
    const view = render(<Presentation steps={steps} title="Deck" />)
    const offenders = everyStyleProperty(view.container).filter((entry) => !ALLOWED_STYLE.has(entry.prop))
    expect(offenders).toEqual([])
  })
})

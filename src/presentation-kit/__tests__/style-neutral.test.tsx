// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Box, Label, Presentation, SceneLayer, type Step } from '../index.ts'

const kitDir = path.resolve(import.meta.dirname, '..')

function kitFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name)
    if (name === '__tests__') return []
    return statSync(p).isDirectory() ? kitFiles(p) : [p]
  })
}

const VISUAL_STYLE =
  /(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\bfontFamily\b|\bfontSize\b|\bfontWeight\b|\bbackground(Color)?\s*:|\bcolor\s*:|\bborder(Width|Color|Style|Radius)?\s*:|\bboxShadow\b|\btextShadow\b|\bfilter\s*:|--[a-z-]+\s*:)/

describe('style ownership boundary', () => {
  it('ships no stylesheets and no styling-framework imports in the kit', () => {
    const files = kitFiles(kitDir)
    expect(files.filter((f) => /\.(css|scss|less|sass)$/.test(f))).toEqual([])
    for (const f of files) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/tailwind|styled-components|@emotion|\.css['"]/i)
    }
  })

  it('declares no palette, font, border, shadow, or theme-token values in kit source', () => {
    for (const f of kitFiles(kitDir)) {
      expect(readFileSync(f, 'utf8'), path.relative(kitDir, f)).not.toMatch(VISUAL_STYLE)
    }
  })

  it('the project does not depend on a styling framework', () => {
    const pkg = JSON.parse(readFileSync(path.resolve(kitDir, '../../package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((d) => /tailwind/.test(d))).toEqual([])
  })

  it('renders unstyled: no inline visual styles on any element', () => {
    function Scene() {
      return <SceneLayer><Box id="x" at={{ x: 1, y: 2, w: 3, h: 4 }}>x</Box><Label id="y">y</Label></SceneLayer>
    }
    const steps: Step[] = [{ id: 'a', era: 'e', title: 't', caption: 'c', Scene, payload: undefined }]
    render(<Presentation steps={steps} title="T" initialMode="browse" />)
    for (const el of document.querySelectorAll<HTMLElement>('[data-presentation-root], [data-presentation-root] *')) {
      const s = el.style
      expect([s.color, s.backgroundColor, s.fontFamily, s.border, s.boxShadow, s.fontSize].join(''), el.tagName).toBe('')
    }
  })
})

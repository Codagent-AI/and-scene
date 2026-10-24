import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Presentation } from '../Presentation'
import { Arrow } from '../nodes/Arrow'
import { Box } from '../nodes/Box'
import { Emphasis } from '../nodes/Emphasis'
import { Frame } from '../nodes/Frame'
import { Label } from '../nodes/Label'
import { SymbolChip } from '../nodes/SymbolChip'
import { makeSteps } from './helpers'

afterEach(cleanup)

const VISUAL = [
  'color', 'background', 'backgroundColor', 'border', 'borderColor', 'borderRadius', 'boxShadow',
  'fontFamily', 'fontSize', 'fontWeight', 'padding', 'margin', 'gap', 'textDecoration', 'outline', 'opacity',
]

describe('style ownership boundary', () => {
  it('sets no visual inline styles on primitives or chrome', () => {
    render(
      <Presentation
        steps={makeSteps(3)}
        brand={<span>host</span>}
      />,
    )
    render(
      <div>
        <Box id="b" x={1} y={1} width={5} height={5} />
        <Label id="l" x={1} y={1} />
        <SymbolChip id="c" x={1} y={1} />
        <Frame id="f" x={1} y={1} width={5} height={5} />
        <Emphasis id="e" x={1} y={1} width={5} height={5} />
        <Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 20, y: 5 }} />
      </div>,
    )
    const styled = [...document.querySelectorAll<HTMLElement>('body *')]
    for (const el of styled) {
      for (const prop of VISUAL) {
        const value = (el.style as unknown as Record<string, string>)[prop]
        // motion sets opacity on scene and newcomer wrappers for enter/exit animation only
        if (prop === 'opacity' && el.closest('[data-presentation-scene], [data-presentation-appear]')) continue
        expect(value, `${el.tagName}.${prop}`).toBe('')
      }
    }
  })

  it('exposes stable data-presentation-* hooks on chrome', () => {
    render(<Presentation steps={makeSteps(3)} />)
    for (const hook of ['root', 'header', 'footer', 'title', 'caption', 'marker', 'progress', 'attribution', 'stage', 'canvas']) {
      expect(document.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
  })

  it('contains no stylesheets, color or font literals, or styling-framework imports', () => {
    const dir = path.resolve(__dirname, '..')
    const files: string[] = []
    const walk = (d: string) => {
      for (const name of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, name.name)
        if (name.isDirectory()) {
          if (name.name !== '__tests__') walk(full)
        } else files.push(full)
      }
    }
    walk(dir)
    expect(files.filter((f) => /\.(css|scss|sass|less)$/.test(f))).toEqual([])
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      expect(source, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|font-?family|tailwind|styled-components|@emotion/i)
    }
  })

  it('declares no styling framework in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((d) => /tailwind|styled-components|emotion|bootstrap/.test(d))).toEqual([])
  })
})

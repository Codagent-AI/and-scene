import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'

describe('style-neutral kit contract', () => {
  it('contains no visual-style declarations or framework dependency', () => {
    const kit = resolve(process.cwd(), 'src/presentation-kit')
    const collect = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(directory, entry.name)
      return entry.isDirectory() ? collect(path) : /\.tsx?$/.test(entry.name) ? [readFileSync(path, 'utf8')] : []
    })
    const sources = collect(kit).join('\n')
    expect(sources).not.toMatch(/(?:color|backgroundColor|border|boxShadow|fontFamily)\s*:/i)
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((name) => /tailwind|styled-components/i.test(name))).toEqual([])
  })
})

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('routing sources', () => {
  it('uses an explicit registry and the pathname router without a routing library or glob discovery', () => {
    const read = (f: string) => readFileSync(join(process.cwd(), 'src', f), 'utf8')
    expect(read('./presentations/index.ts')).not.toContain('import.meta.glob')
    expect(read('./presentations/index.ts')).toMatch(/load: \(\) => import\(/)
    expect(read('./main.tsx')).toContain('window.location.pathname')
    expect(read('./main.tsx')).toContain('StrictMode')
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) => /router/.test(d))).toEqual([])
  })
})

import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SCRIPT_FILES } from '../../scripts/sync-template.mjs'

const BOOTSTRAP = 'skills/presentation/templates/bootstrap'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (name === 'node_modules') return []
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}
const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')
const rel = (base: string, file: string) => path.relative(base, file)

describe('bootstrap template alignment', () => {
  it('keeps the non-test scene kit byte-identical to the canonical source', () => {
    const canonical = walk('src/presentation-kit').filter((f) => !f.includes('__tests__'))
    const template = walk(path.join(BOOTSTRAP, 'src/presentation-kit'))
    expect(template.map((f) => rel(BOOTSTRAP, f)).sort()).toEqual(canonical.map((f) => rel('.', f)).sort())
    for (const file of canonical) expect(hash(path.join(BOOTSTRAP, file)), file).toBe(hash(file))
  })

  it('keeps the verification and inspection scripts byte-identical', () => {
    for (const file of SCRIPT_FILES) {
      expect(hash(path.join(BOOTSTRAP, 'scripts', file)), file).toBe(hash(path.join('scripts', file)))
    }
  })

  it('ships lock data and the full dependency set without a styling framework', () => {
    expect(existsSync(path.join(BOOTSTRAP, 'package-lock.json'))).toBe(true)
    const pkg = JSON.parse(readFileSync(path.join(BOOTSTRAP, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright',
    ]) expect(deps, name).toHaveProperty(name)
    expect(Object.keys(deps).filter((d) => /tailwind/i.test(d))).toEqual([])
    for (const script of ['build', 'lint', 'verify', 'inspect']) expect(pkg.scripts).toHaveProperty(script)
  })

  it('has no default colors or fonts in the host stylesheet', () => {
    const css = readFileSync(path.join(BOOTSTRAP, 'src/index.css'), 'utf8')
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|font-family|--[\w-]+\s*:/i)
  })

  it('derives the starter from the new-presentation template', () => {
    const starter = readFileSync(path.join(BOOTSTRAP, 'src/presentations/starter/talk.css'), 'utf8')
    expect(starter).toContain('.p-starter')
    expect(starter).not.toContain('__SLUG__')
  })
})

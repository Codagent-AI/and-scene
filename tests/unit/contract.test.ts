import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '../..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}
const rel = (base: string, files: string[]) => files.map((f) => path.relative(base, f)).sort()
const json = (file: string) => JSON.parse(readFileSync(file, 'utf8'))

describe('style-neutral kit contract', () => {
  const kitFiles = walk(path.join(root, 'src/presentation-kit'))

  it('ships no stylesheet and no styling-framework reference', () => {
    expect(kitFiles.filter((f) => /\.(css|scss|sass|less)$/.test(f))).toEqual([])
    for (const f of kitFiles) expect(readFileSync(f, 'utf8'), f).not.toMatch(/tailwind|styled-components|@emotion|\.css['"]/i)
  })

  it('declares no palette, font, border, shadow, card or theme defaults', () => {
    const forbidden = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?:font[A-Za-z]*|border[A-Za-z]*|background[A-Za-z]*|boxShadow|color|borderRadius|padding|margin|gap)\s*:|--[a-z-]+\s*:/
    for (const f of kitFiles.filter((f) => /\.(ts|tsx)$/.test(f))) {
      const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      expect(code, f).not.toMatch(forbidden)
    }
  })

  it('keeps the scaffold free of Tailwind and presentation styling defaults', () => {
    const pkg = json(path.join(bootstrap, 'package.json'))
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) => /tailwind/i.test(d))).toEqual([])
    const css = walk(bootstrap).filter((f) => f.endsWith('.css'))
    for (const f of css) expect(readFileSync(f, 'utf8'), f).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|font-family|box-shadow|--[a-z-]+\s*:/i)
    expect(readFileSync(path.join(bootstrap, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
  })

  it('keeps the sample presentation styling outside the kit', () => {
    const sampleCss = walk(path.join(root, 'src/presentations/how-to-make-a-presentation')).filter((f) => f.endsWith('.css'))
    expect(sampleCss.length).toBeGreaterThan(0)
    const css = sampleCss.map((f) => readFileSync(f, 'utf8')).join('\n')
    expect(css).toMatch(/\[data-presentation-attribution\]/)
    expect(css).toMatch(/\[data-presentation-active='true'\]/)
  })
})

describe('bootstrap template', () => {
  it('declares the complete dependency set and a working build script', () => {
    const pkg = json(path.join(bootstrap, 'package.json'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const d of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright',
    ]) {
      expect(deps, d).toHaveProperty(d)
    }
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.scripts.verify).toBeDefined()
    expect(pkg.scripts.inspect).toBeDefined()
  })

  it('has a lockfile and all three scaffold anchors', () => {
    const files = rel(bootstrap, walk(bootstrap))
    expect(files).toContain('package-lock.json')
    expect(files).toContain('vite.config.ts')
    expect(files).toContain('src/presentation-kit/Presentation.tsx')
    expect(files).toContain('src/presentations/index.ts')
  })
})

describe('template parity', () => {
  it('keeps the bootstrap kit byte-aligned with src/presentation-kit', () => {
    const canonical = path.join(root, 'src/presentation-kit')
    const copy = path.join(bootstrap, 'src/presentation-kit')
    expect(rel(copy, walk(copy))).toEqual(rel(canonical, walk(canonical)))
    for (const f of rel(canonical, walk(canonical))) {
      expect(readFileSync(path.join(copy, f)).equals(readFileSync(path.join(canonical, f))), f).toBe(true)
    }
  })

  it.each(['verify.mjs', 'inspect-presentation.mjs', 'preview.mjs'])('keeps scripts/%s aligned with its template copy', (name) => {
    expect(readFileSync(path.join(bootstrap, 'scripts', name)).equals(readFileSync(path.join(root, 'scripts', name)))).toBe(true)
  })
})

describe('repository conventions', () => {
  it('keeps npm test to the fast unit suite', () => {
    const pkg = json(path.join(root, 'package.json'))
    expect(pkg.scripts.test).toBe('vitest run')
    expect(pkg.scripts['test:integration']).toMatch(/integration/)
    const config = readFileSync(path.join(root, 'vite.config.ts'), 'utf8')
    expect(config).toMatch(/tests\/unit/)
    expect(config).not.toMatch(/integration|e2e/)
  })

  it('uses the shared IPv4 loopback address and never localhost in browser scripts', () => {
    expect(readFileSync(path.join(root, 'scripts/preview.mjs'), 'utf8')).toContain("export const HOST = '127.0.0.1'")
    for (const f of ['verify.mjs', 'inspect-presentation.mjs', 'preview.mjs']) {
      const src = readFileSync(path.join(root, 'scripts', f), 'utf8')
      expect(src).not.toMatch(/localhost/)
      if (f !== 'preview.mjs') expect(src).toMatch(/import \{[^}]*\bHOST\b[^}]*\} from '\.\/preview\.mjs'/)
    }
  })

  it('passes typed payloads across the Presentation boundary without casts', () => {
    const dir = path.join(root, 'src/presentations/how-to-make-a-presentation')
    for (const f of walk(dir).filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith('meta.ts'))) {
      const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      expect(code, f).not.toMatch(/\sas\s(?!const\b)\w|<any>|:\s*any\b/)
    }
  })

  it('does not track build output, dependencies, screenshots or CI configuration', () => {
    const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n')
    expect(tracked.filter((f) => /(^|\/)(dist|node_modules|\.inspection)\//.test(f) || /\.png$/.test(f) || f.startsWith('.github/'))).toEqual([])
    expect(readFileSync(path.join(root, '.gitignore'), 'utf8')).toMatch(/^\.inspection$/m)
  })
})

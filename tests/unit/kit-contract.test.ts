import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..', '..')
const KIT = join(ROOT, 'src', 'presentation-kit')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const files = walk(KIT)
const sources = files.filter((f) => /\.(ts|tsx)$/.test(f))

// Visual style properties the reusable kit must never set. Layout geometry is allowed.
const VISUAL_STYLE = /\b(color|background\w*|border\w*|boxShadow|textShadow|fontFamily|fontSize|fontWeight|lineHeight|letterSpacing|padding\w*|gap|rowGap|columnGap|filter|outline\w*)\s*:/
const NON_AUTO_MARGIN = /\bmargin\w*\s*:\s*(?!'auto'|\s)/

describe('style-neutral kit contract', () => {
  it('ships no stylesheet or theme file', () => {
    const offenders = files.filter((f) => /\.(css|scss|sass|less|styl)$/.test(f) || /theme|tokens/i.test(f))
    expect(offenders.map((f) => relative(ROOT, f))).toEqual([])
  })

  it.each(sources.map((f) => [relative(KIT, f), f]))('%s sets no visual defaults', (_name, file) => {
    const text = readFileSync(file, 'utf8')
    const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(stripped.match(VISUAL_STYLE)?.[0]).toBeUndefined()
    expect(stripped.match(NON_AUTO_MARGIN)?.[0]).toBeUndefined()
    expect(stripped).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/)
    expect(stripped).not.toMatch(/tailwind|className=["'`]/i)
    expect(stripped).not.toMatch(/import\s+['"][^'"]*\.css['"]/)
  })

  it('imports only react, motion, lucide-react, and kit-local modules', () => {
    const allowed = /^(react|react\/jsx-runtime|motion\/react|lucide-react|\.{1,2}\/.*)$/
    for (const file of sources) {
      const imports = [...readFileSync(file, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1])
      for (const spec of imports) expect(spec, `${relative(ROOT, file)} imports ${spec}`).toMatch(allowed)
    }
  })

  it('does not make a styling framework a project dependency', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((d) => /tailwind/i.test(d))).toEqual([])
    expect(readFileSync(join(ROOT, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
  })
})

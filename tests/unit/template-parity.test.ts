import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { MIRRORS, planSync, syncTemplates } from '../../scripts/sync-templates.mjs'

const repo = resolve(__dirname, '../..')
const template = join(repo, 'skills/presentation/templates/bootstrap')

function files(dir: string, base = dir): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...files(full, base))
    else out.push(relative(base, full).split('\\').join('/'))
  }
  return out.sort()
}

const isTest = (f: string) => /(\.test\.|\.spec\.|__tests__)/.test(f)

describe('canonical sources and bootstrap template stay byte-aligned', () => {
  it('kit: same non-test file set and identical bytes', () => {
    const canonical = files(join(repo, 'src/presentation-kit')).filter((f) => !isTest(f))
    const copy = files(join(template, 'src/presentation-kit')).filter((f) => !isTest(f))
    expect(copy).toEqual(canonical)
    expect(canonical.length).toBeGreaterThan(5)
    for (const rel of canonical) {
      const a = readFileSync(join(repo, 'src/presentation-kit', rel))
      expect(readFileSync(join(template, 'src/presentation-kit', rel)).equals(a), rel).toBe(true)
    }
  })

  it('root verify and inspect scripts and their lib match the bootstrap copies', () => {
    for (const rel of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(readFileSync(join(template, rel)).equals(readFileSync(join(repo, rel))), rel).toBe(true)
    }
    const lib = files(join(repo, 'scripts/lib'))
    expect(files(join(template, 'scripts/lib'))).toEqual(lib)
    for (const rel of lib) {
      expect(readFileSync(join(template, 'scripts/lib', rel)).equals(readFileSync(join(repo, 'scripts/lib', rel))), rel).toBe(true)
    }
  })

  it('does not ship the canonical sample expectations in the bootstrap', () => {
    expect(files(template).filter((f) => f.includes('verify.reference'))).toEqual([])
  })

  it('sync --check logic reports no drift for the real tree', () => {
    expect(planSync().drift).toEqual([])
  })
})

describe('sync-templates behavior over fixtures', () => {
  const dirs: string[] = []
  afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

  function fixture() {
    const base = mkdtempSync(join(tmpdir(), 'sync-'))
    dirs.push(base)
    const source = join(base, 'src-repo')
    const target = join(base, 'tpl')
    const put = (root: string, rel: string, text: string) => {
      mkdirSync(dirname(join(root, rel)), { recursive: true })
      writeFileSync(join(root, rel), text)
    }
    put(source, 'src/presentation-kit/a.ts', 'a')
    put(source, 'src/presentation-kit/nodes/b.ts', 'b')
    put(source, 'scripts/verify.mjs', 'v')
    put(source, 'scripts/inspect-presentation.mjs', 'i')
    put(source, 'scripts/lib/h.mjs', 'h')
    put(source, 'scripts/verify.reference.json', '{}')
    mkdirSync(target, { recursive: true })
    return { source, target, put }
  }

  it('copies every mirrored file but never the reference data, then passes --check', () => {
    const { source, target } = fixture()
    const plan = syncTemplates({ source, target })
    expect(plan.copy.map((c) => c.rel).sort()).toEqual([
      'scripts/inspect-presentation.mjs',
      'scripts/lib/h.mjs',
      'scripts/verify.mjs',
      'src/presentation-kit/a.ts',
      'src/presentation-kit/nodes/b.ts',
    ])
    expect(files(target)).not.toContain('scripts/verify.reference.json')
    expect(syncTemplates({ check: true, source, target }).drift).toEqual([])
  })

  it('detects missing, differing and extra files in check mode without writing', () => {
    const { source, target, put } = fixture()
    syncTemplates({ source, target })
    put(target, 'src/presentation-kit/a.ts', 'edited')
    put(target, 'src/presentation-kit/extra.ts', 'x')
    rmSync(join(target, 'scripts/lib/h.mjs'))
    const check = syncTemplates({ check: true, source, target })
    expect(check.drift.sort()).toEqual([
      'differs: src/presentation-kit/a.ts',
      'extra in template: src/presentation-kit/extra.ts',
      'missing in template: scripts/lib/h.mjs',
    ])
    expect(readFileSync(join(target, 'src/presentation-kit/a.ts'), 'utf8')).toBe('edited')
    syncTemplates({ source, target })
    expect(planSync(source, target).drift).toEqual([])
  })

  it('mirrors only the documented kit and script paths', () => {
    expect(MIRRORS.map((m) => m.path)).toEqual([
      'src/presentation-kit',
      'scripts/verify.mjs',
      'scripts/inspect-presentation.mjs',
      'scripts/lib',
    ])
  })
})

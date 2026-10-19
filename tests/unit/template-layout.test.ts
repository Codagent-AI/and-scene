import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const skill = join(root, 'skills/presentation')
const bootstrap = join(skill, 'templates/bootstrap')

/** Parses the flat `key: value` frontmatter block of a markdown file. */
function frontmatter(file: string): Record<string, string> {
  const text = readFileSync(file, 'utf8')
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!match) throw new Error('missing frontmatter')
  const out: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line)
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '')
  }
  return out
}

function expectFiles(base: string, files: string[]): void {
  for (const f of files) expect(existsSync(join(base, f)), `${f} is missing`).toBe(true)
}

describe('skill tree (structure only)', () => {
  it('has a SKILL.md whose frontmatter names the skill and describes it', () => {
    const meta = frontmatter(join(skill, 'SKILL.md'))
    expect(meta.name).toBe('presentation')
    expect(meta.description.length).toBeGreaterThan(20)
  })

  it('ships the detection helper', () => {
    expectFiles(skill, ['scripts/detect-scaffold.mjs', 'scripts/detect-scaffold.d.mts'])
  })

  it('has new-presentation templates', () => {
    expectFiles(join(skill, 'templates/presentation'), [
      'entities.ts',
      'Talk.tsx',
      'styles.css',
      'steps/index.ts',
      'steps/Scene.tsx',
    ])
  })

  it('has a complete bootstrap app', () => {
    expectFiles(bootstrap, [
      'package.json',
      'package-lock.json',
      'index.html',
      'vite.config.ts',
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
      'eslint.config.js',
      '.gitignore',
      'src/main.tsx',
      'src/Root.tsx',
      'src/route.ts',
      'src/Landing.tsx',
      'src/index.css',
      'src/presentations/index.ts',
      'src/presentations/starter/entities.ts',
      'src/presentations/starter/Talk.tsx',
      'src/presentation-kit/index.ts',
      'src/presentation-kit/types.ts',
      'src/presentation-kit/Stage.tsx',
      'src/presentation-kit/Presentation.tsx',
      'scripts/verify.mjs',
      'scripts/inspect-presentation.mjs',
    ])
  })

  it('keeps canonical sample expectations out of the bootstrap', () => {
    expect(existsSync(join(bootstrap, 'scripts/verify.reference.json'))).toBe(false)
    expect(existsSync(join(bootstrap, 'src/presentations/how-to-make-a-presentation'))).toBe(false)
  })

  it('bootstrap scripts expose build, lint, preview, verify and inspect and no test runner', () => {
    const pkg = JSON.parse(readFileSync(join(bootstrap, 'package.json'), 'utf8'))
    for (const name of ['dev', 'build', 'lint', 'preview', 'verify', 'inspect']) {
      expect(pkg.scripts[name], name).toEqual(expect.any(String))
    }
    expect(pkg.scripts.verify).toContain('scripts/verify.mjs')
    expect(pkg.scripts.inspect).toContain('scripts/inspect-presentation.mjs')
    expect(pkg.devDependencies.playwright).toBe('1.61.0')
  })
})

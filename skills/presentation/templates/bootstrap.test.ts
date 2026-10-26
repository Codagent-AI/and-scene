import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '../../..')
const bootstrapDir = path.join(__dirname, 'bootstrap')
const canonicalKitDir = path.join(repoRoot, 'src/presentation-kit')
const templateKitDir = path.join(bootstrapDir, 'src/presentation-kit')

function listFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listFiles(full))
    } else if (!entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) {
      out.push(full)
    }
  }
  return out
}

describe('bootstrap template scene kit', () => {
  it('stays byte-aligned with the canonical src/presentation-kit source files', () => {
    const canonicalFiles = listFiles(canonicalKitDir).map((f) => path.relative(canonicalKitDir, f)).sort()
    const templateFiles = listFiles(templateKitDir).map((f) => path.relative(templateKitDir, f)).sort()
    expect(templateFiles).toEqual(canonicalFiles)

    for (const relative of canonicalFiles) {
      const canonical = readFileSync(path.join(canonicalKitDir, relative), 'utf8')
      const template = readFileSync(path.join(templateKitDir, relative), 'utf8')
      expect(template, `${relative} drifted from the canonical kit`).toBe(canonical)
    }
  })

  it('ships with zero visual-default styling and no styling-framework dependency', () => {
    const forbiddenPattern = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bfont-family\s*:|\bbox-shadow\s*:|\btailwind/i
    const files = listFiles(bootstrapDir).filter((f) => /\.(ts|tsx|css)$/.test(f))
    for (const file of files) {
      const contents = readFileSync(file, 'utf8')
      expect(contents, `${path.relative(bootstrapDir, file)} contains a visual default`).not.toMatch(forbiddenPattern)
    }

    const pkg = JSON.parse(readFileSync(path.join(bootstrapDir, 'package.json'), 'utf8'))
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
    expect(Object.keys(allDeps).some((name) => name.toLowerCase().includes('tailwind'))).toBe(false)
  })

  it('builds cleanly once materialized into a fresh project directory', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'and-scene-bootstrap-'))
    try {
      cpSync(bootstrapDir, tempDir, {
        recursive: true,
        filter: (src) => !src.endsWith('.test.ts') && !src.endsWith('.test.tsx'),
      })
      symlinkSync(path.join(repoRoot, 'node_modules'), path.join(tempDir, 'node_modules'), 'dir')

      execFileSync('node_modules/.bin/tsc', ['-b', '--force'], { cwd: tempDir, stdio: 'pipe' })
      execFileSync('node_modules/.bin/vite', ['build'], { cwd: tempDir, stdio: 'pipe' })

      const distStats = statSync(path.join(tempDir, 'dist/index.html'))
      expect(distStats.isFile()).toBe(true)
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })
})

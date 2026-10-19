import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, matchesGlob } from 'node:path'
import { describe, expect, it } from 'vitest'
import defaultConfig from '../../vite.config'
import integrationConfig from '../../vitest.integration.config'
import { KIT_DIRS, REPO_ROOT, kitAbsolutePaths, listKitFiles } from './helpers/kit-scan'

const readJson = (rel: string) => JSON.parse(readFileSync(join(REPO_ROOT, rel), 'utf8'))
const readText = (rel: string) => readFileSync(join(REPO_ROOT, rel), 'utf8')

/** Frameworks that would make the kit or scaffold require a styling system. */
const STYLING_FRAMEWORK = /(^|\/|")(tailwindcss|@tailwindcss\/[\w.-]+|@tailwindcss\/vite|tailwind[\w.-]*|styled-components|@emotion\/[\w.-]+|emotion|@stitches\/[\w.-]+|styled-jsx|@linaria\/[\w.-]+|@vanilla-extract\/[\w.-]+|@mui\/[\w.-]+|@chakra-ui\/[\w.-]+|@mantine\/[\w.-]+|@fluentui\/[\w.-]+|antd|bootstrap|jss|react-jss)(?=["@/\s]|$)/

const pkg = readJson('package.json')
const allDeps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies }

/** Package names from a kit file's import/export/require specifiers. */
function importSpecifiers(text: string): string[] {
  const out: string[] = []
  const re = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g
  for (const m of text.matchAll(re)) out.push(m[1])
  return out
}

const packageName = (spec: string) => {
  const parts = spec.split('/')
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

describe('root manifest contract (L-12)', () => {
  it('package.json declares the required scripts', () => {
    for (const name of ['test', 'lint', 'build', 'verify', 'inspect', 'test:integration']) {
      expect(typeof pkg.scripts?.[name], `script ${name}`).toBe('string')
    }
  })

  it('npm test runs only the fast unit/contract config and excludes integration, e2e and browser suites', () => {
    const script: string = pkg.scripts.test
    expect(script).not.toMatch(/integration|e2e|playwright|browser|--config|--project/)
    const unitInclude = defaultConfig.test?.include ?? []
    const slowFiles = ['tests/integration/int-001.test.ts', 'tests/e2e/e2e-001.test.ts', 'tests/browser/flow.test.ts']
    for (const f of slowFiles) {
      expect(unitInclude.some((g) => matchesGlob(f, g)), f).toBe(false)
    }
    expect(unitInclude.some((g) => matchesGlob('tests/unit/manifest.test.ts', g))).toBe(true)
  })

  it('the integration script runs the separate integration config, which covers integration and e2e suites', () => {
    expect(pkg.scripts['test:integration']).toMatch(/vitest run --config vitest\.integration\.config\.ts/)
    const include = integrationConfig.test?.include ?? []
    expect(include.some((g) => matchesGlob('tests/integration/int-001.test.ts', g))).toBe(true)
    expect(include.some((g) => matchesGlob('tests/e2e/e2e-001.test.ts', g))).toBe(true)
    expect(include.some((g) => matchesGlob('tests/unit/manifest.test.ts', g))).toBe(false)
  })

  it('declares the required dependency set (react, tooling, eslint stack, playwright)', () => {
    const required = [
      'react',
      'react-dom',
      'motion',
      'lucide-react',
      'vite',
      '@vitejs/plugin-react',
      'typescript',
      '@types/react',
      '@types/react-dom',
      '@types/node',
      'eslint',
      '@eslint/js',
      'typescript-eslint',
      'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh',
      'globals',
      'playwright',
    ]
    for (const name of required) expect(allDeps[name], name).toBeDefined()
  })

  it('the lock file records every required root dependency at the root', () => {
    const lock = readJson('package-lock.json')
    const root = lock.packages?.['']
    expect(root).toBeDefined()
    const declared = { ...root.dependencies, ...root.devDependencies }
    for (const name of Object.keys(allDeps)) {
      expect(declared[name], `lock root ${name}`).toBe(allDeps[name])
      expect(lock.packages[`node_modules/${name}`], `lock entry ${name}`).toBeDefined()
    }
  })

  it('package.json and package-lock.json name no styling framework', () => {
    expect(readText('package.json')).not.toMatch(STYLING_FRAMEWORK)
    const lockPackages = Object.keys(readJson('package-lock.json').packages ?? {})
    const offenders = lockPackages.filter((k) => STYLING_FRAMEWORK.test(k.replace(/^node_modules\//, '') + '"'))
    expect(offenders).toEqual([])
  })

  it('vite, eslint, typescript and vitest configs name no styling framework', () => {
    for (const rel of ['vite.config.ts', 'vitest.integration.config.ts', 'eslint.config.js', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'index.html']) {
      expect(readText(rel), rel).not.toMatch(STYLING_FRAMEWORK)
    }
    expect(readText('vite.config.ts')).not.toMatch(/tailwind|postcss/i)
  })
})

describe('kit import graph (L-12)', () => {
  const ALLOWED_PACKAGES = new Set(['react', 'react-dom', 'motion', 'lucide-react'])

  it.each(KIT_DIRS)('%s imports only react, motion and lucide-react, or relative kit files', (dir) => {
    const offenders: string[] = []
    for (const abs of listKitFiles(join(REPO_ROOT, dir))) {
      const text = readFileSync(abs, 'utf8')
      if (/\.(css|scss|sass|less|styl)$/.test(abs)) offenders.push(`${abs} is a stylesheet`)
      for (const spec of importSpecifiers(text)) {
        if (spec.startsWith('.')) continue
        const name = packageName(spec)
        if (!ALLOWED_PACKAGES.has(name)) offenders.push(`${abs} imports ${spec}`)
        if (STYLING_FRAMEWORK.test(spec)) offenders.push(`${abs} imports styling framework ${spec}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('the import scanner recognises a planted framework import (negative control)', () => {
    const specs = importSpecifiers(
      "import styled from 'styled-components'\nimport './x.css'\nimport { motion } from 'motion/react'\nconst t = await import('tailwindcss')",
    )
    expect(specs).toEqual(['styled-components', './x.css', 'motion/react', 'tailwindcss'])
    expect(specs.filter((s) => !s.startsWith('.') && !ALLOWED_PACKAGES.has(packageName(s))).sort()).toEqual([
      'styled-components',
      'tailwindcss',
    ])
    expect(STYLING_FRAMEWORK.test('styled-components')).toBe(true)
    expect(STYLING_FRAMEWORK.test('tailwindcss')).toBe(true)
    expect(STYLING_FRAMEWORK.test('@emotion/react')).toBe(true)
  })

  it('kit directories exist in the repository', () => {
    for (const abs of kitAbsolutePaths()) expect(existsSync(abs)).toBe(true)
  })
})

describe('repository hygiene (L-65 automated part of L-12 scope)', () => {
  const tracked = () =>
    execFileSync('git', ['ls-files'], { cwd: REPO_ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)

  it('.github/workflows is absent', () => {
    expect(existsSync(join(REPO_ROOT, '.github', 'workflows'))).toBe(false)
  })

  it('git tracks no build output, dependency directories or inspection screenshots', () => {
    const bad = tracked().filter(
      (f) => /^(dist|node_modules|\.inspection)\//.test(f) || /(^|\/)step-\d+\.png$/.test(f) || /^playwright-report\//.test(f),
    )
    expect(bad).toEqual([])
  })

  it('.gitignore excludes build output, dependencies and inspection screenshots', () => {
    const ignore = readText('.gitignore')
    for (const entry of ['node_modules', 'dist', '.inspection']) {
      expect(ignore.split('\n').map((l) => l.trim())).toContain(entry)
    }
  })
})

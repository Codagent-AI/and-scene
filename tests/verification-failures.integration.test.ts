import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isolatedCopy } from './helpers/isolated-copy'

function runVerifier(temp: string) {
  return spawnSync(process.execPath, ['scripts/verify.mjs'], { cwd: temp, encoding: 'utf8' })
}

function prepend(path: string, text: string) {
  writeFileSync(path, `${text}${readFileSync(path, 'utf8')}`)
}

function replaceIn(path: string, search: string, replacement: string) {
  writeFileSync(path, readFileSync(path, 'utf8').replace(search, replacement))
}

describe('E2E-002 actionable verifier failures', () => {
  it('returns non-zero and names a build failure without touching the source checkout', () => {
    const temp = isolatedCopy('build-failure')
    try {
      const pkg = JSON.parse(readFileSync(join(temp, 'package.json'), 'utf8'))
      pkg.scripts.build = 'node -e "process.exit(2)"'
      writeFileSync(join(temp, 'package.json'), JSON.stringify(pkg))
      const result = runVerifier(temp)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('FAIL: npm run build exited with 2')
    } finally { rmSync(temp, { recursive: true, force: true }) }
  })

  it('returns non-zero and names a missing canonical step before rendering', () => {
    const temp = isolatedCopy('sample-failure')
    try {
      replaceIn(join(temp, 'src/presentations/how-to-make-a-presentation/steps/index.ts'), 'You have a topic', 'An altered title')
      const result = runVerifier(temp)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('sample check: missing or out-of-order canonical step: You have a topic')
    } finally { rmSync(temp, { recursive: true, force: true }) }
  })

  it.each([
    {
      fault: 'console',
      inject: (temp: string) => prepend(join(temp, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx'), "console.error('controlled fixture failure')\n"),
      expected: 'step 1: console controlled fixture failure',
    },
    {
      fault: 'transition',
      inject: (temp: string) => replaceIn(join(temp, 'src/presentation-kit/Presentation.tsx'), 'data-step-index={index}', 'data-step-index={0}'),
      expected: 'render check: step 2: expected data-step-index 1',
    },
  ])('identifies a browser $fault fault by step, then cleans up preview processes', ({ fault, inject, expected }) => {
    const temp = isolatedCopy(`${fault}-failure`)
    try {
      inject(temp)
      const result = runVerifier(temp)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(expected)
      expect(result.stderr).toContain('FAIL:')
    } finally { rmSync(temp, { recursive: true, force: true }) }
  }, 90_000)
})

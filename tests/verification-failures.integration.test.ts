import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? '/ms-playwright/chromium-1228/chrome-linux64/chrome'

function isolatedCopy(label: string) {
  const temp = mkdtempSync(join(tmpdir(), `and-scene-${label}-`))
  cpSync(root, temp, { recursive: true, filter: (source) => !source.slice(root.length).split('/').some((part) => ['node_modules', 'dist', '.git', 'artifacts'].includes(part)) })
  symlinkSync(join(root, 'node_modules'), join(temp, 'node_modules'), 'dir')
  return temp
}

function runVerifier(temp: string) {
  return spawnSync(process.execPath, ['scripts/verify.mjs'], { cwd: temp, encoding: 'utf8', env: { ...process.env, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: chromiumPath } })
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
      const path = join(temp, 'src/presentations/how-to-make-a-presentation/steps/index.ts')
      writeFileSync(path, readFileSync(path, 'utf8').replace('You have a topic', 'An altered title'))
      const result = runVerifier(temp)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('sample check: missing or out-of-order canonical step: You have a topic')
    } finally { rmSync(temp, { recursive: true, force: true }) }
  })

  it('identifies browser console faults and stuck step transitions, then cleans up preview processes', () => {
    for (const fault of ['console', 'transition']) {
      const temp = isolatedCopy(`${fault}-failure`)
      try {
        const talk = join(temp, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
        if (fault === 'console') writeFileSync(talk, `console.error('controlled fixture failure')\n${readFileSync(talk, 'utf8')}`)
        else {
          const host = join(temp, 'src/presentation-kit/Presentation.tsx')
          writeFileSync(host, readFileSync(host, 'utf8').replace('data-step-index={index}', 'data-step-index={0}'))
        }
        const result = runVerifier(temp)
        expect(result.status).toBe(1)
        expect(result.stderr).toContain(fault === 'console' ? 'step 1: console controlled fixture failure' : 'render check: step 2: expected data-step-index 1')
        expect(result.stderr).toContain('FAIL:')
      } finally { rmSync(temp, { recursive: true, force: true }) }
    }
  }, 90_000)
})

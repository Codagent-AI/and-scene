import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { REFERENCE_STEPS } from '../src/presentations/how-to-make-a-presentation/steps'

const root = process.cwd()
let nextPort = 43000 + (process.pid % 1000)
function isolatedCopy(fault: (copy: string) => void, buildCommand = 'node -e "process.exit(0)"'): string {
  const copy = mkdtempSync(join(root, '.tmp-and-scene-verify-'))
  mkdirSync(join(copy, 'src/presentations/how-to-make-a-presentation/steps'), { recursive: true })
  mkdirSync(join(copy, 'scripts'), { recursive: true })
  mkdirSync(join(copy, 'dist'), { recursive: true })
  symlinkSync(join(root, 'node_modules'), join(copy, 'node_modules'), 'dir')
  cpSync(join(root, 'scripts/verify.mjs'), join(copy, 'scripts/verify.mjs'))
  writeFileSync(join(copy, 'src/presentations/index.ts'), readFileSync(join(root, 'src/presentations/index.ts'), 'utf8'))
  cpSync(join(root, 'src/presentations/how-to-make-a-presentation/steps/index.tsx'), join(copy, 'src/presentations/how-to-make-a-presentation/steps/index.tsx'))
  writeFileSync(join(copy, 'package.json'), JSON.stringify({ type: 'module', scripts: { build: buildCommand } }))
  fault(copy)
  return copy
}
function browserFixture({ errorAt, blocked = false }: { errorAt?: number; blocked?: boolean }): string {
  const titles = REFERENCE_STEPS.map((step) => step.title)
  const captions = REFERENCE_STEPS.map((step) => step.caption)
  return `<!doctype html><html><head><meta charset="utf-8"></head><body><main data-presentation-mode="browse"><div class="presentation-narration"><h2>${titles[0]}</h2><p>${captions[0]}</p></div><span data-step-count="9" data-step-index="0"></span><button aria-label="Next step" id="next">Next</button></main><script>const titles=${JSON.stringify(titles)};const captions=${JSON.stringify(captions)};let index=0;document.querySelector('#next').onclick=()=>{${blocked ? '' : "index++;document.querySelector('[data-step-count]').setAttribute('data-step-index',index);document.querySelector('.presentation-narration h2').textContent=titles[index];document.querySelector('.presentation-narration p').textContent=captions[index];"}${errorAt ? `if(index===${errorAt - 1})console.error('injected browser console failure');` : ''}}</script></body></html>`
}
function runVerifier(copy: string) {
  const port = nextPort++
  return spawnSync(process.execPath, ['scripts/verify.mjs'], { cwd: copy, encoding: 'utf8', timeout: 120000, env: { ...process.env, AND_SCENE_VERIFY_PORT: String(port), AND_SCENE_VERIFY_TRANSITION_TIMEOUT_MS: '1000', AND_SCENE_VERIFY_ACTION_TIMEOUT_MS: '1000' } })
}

describe('reference production verification failure contract (E2E-002)', () => {
  it('returns actionable failures from isolated build, missing-sample, browser-error, and transition faults', () => {
    const cases: Array<{ label: string; fault: (copy: string) => void; message: RegExp; build?: string }> = [
      { label: 'build failure', fault: () => {}, build: 'node -e "process.exit(3)"', message: /FAIL: build:/ },
      {
        label: 'missing reference registration',
        fault: copy => writeFileSync(join(copy, 'src/presentations/index.ts'), "import type React from 'react'\nexport interface PresentationRegistration { slug: string; title: string; load: () => Promise<{ default: React.ComponentType }> }\nexport const presentations: PresentationRegistration[] = []\n"),
        message: /FAIL: build: reference sample is missing from the presentation registry/,
      },
      { label: 'browser runtime error', fault: copy => writeFileSync(join(copy, 'dist/index.html'), browserFixture({ errorAt: 7 })), message: /FAIL: step 7:.*injected browser console failure/ },
      { label: 'failed step transition', fault: copy => writeFileSync(join(copy, 'dist/index.html'), browserFixture({ blocked: true })), message: /FAIL: step 1:.*Timeout/ },
    ]
    for (const scenario of cases) {
      const copy = isolatedCopy(scenario.fault, scenario.build)
      try {
        const result = runVerifier(copy)
        const output = `${result.stdout}${result.stderr}`
        expect(result.error, scenario.label).toBeUndefined()
        expect(result.status, scenario.label).not.toBe(0)
        expect(output, scenario.label).toMatch(scenario.message)
        expect(output, scenario.label).not.toContain('PASS: production render')
      } finally {
        rmSync(copy, { recursive: true, force: true })
      }
    }
  }, 240000)
})

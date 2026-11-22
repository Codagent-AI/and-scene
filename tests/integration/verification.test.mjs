import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { it, expect } from 'vitest'
import { copyApp, replace, command, success, remove, assertCleaned } from './helpers.mjs'
it('E2E-001 reference passes whole-app production verification with nine indices and IPv4', async () => {
  const directory = await copyApp()
  try {
    const output = success(command(directory, ['npm', 'run', 'verify']))
    expect(output).toContain('PASS verify how-to-make-a-presentation: 9 steps')
    for (let i = 0; i < 9; i++) expect(output).toContain(`render step ${i}: pass`)
    expect(output).toContain('http://127.0.0.1:')
    expect(output).not.toContain('localhost')
    assertCleaned(output)
    console.log(output)
    await replace(directory, 'src/presentations/how-to-make-a-presentation/Talk.tsx', 'initialMode="browse"', 'initialMode="present"')
    const present = success(command(directory, ['npm', 'run', 'verify']))
    expect(present).toContain('initial mode present: pass')
    expect(present).toContain('PASS verify how-to-make-a-presentation: 9 steps')
    for (let i = 0; i < 9; i++) expect(present).toContain(`render step ${i}: pass`)
    assertCleaned(present)
    console.log(present)
  } finally { await remove(directory) }
})
it('E2E-002 build missing malformed console page render and stalled-transition failures are actionable and cleaned up', async () => {
  const cases = [
    ['build', async d => writeFile(join(d, 'src/broken.ts'), 'export const broken: number = "bad"'), /build: npm run build failed/],
    ['missing', async d => replace(d, 'src/presentations/index.ts', "slug: 'how-to-make-a-presentation'", "slug: 'missing'"), /render step 0/],
    ['malformed', async d => replace(d, 'src/presentations/how-to-make-a-presentation/steps/index.ts', '[step1, step2', '[step2, step1'), /reference sample/],
    ['console', async d => replace(d, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', 'return <SceneLayer>', 'if (beat === 3) console.error("injected console fault"); return <SceneLayer>'), /render step 2:.*injected console fault/],
    ['page', async d => replace(d, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', 'return <SceneLayer>', 'if (beat === 3) setTimeout(() => { throw new Error("injected page fault") }, 50); return <SceneLayer>'), /render step 2:.*injected page fault/],
    ['render', async d => replace(d, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', 'return <SceneLayer>', 'if (beat === 3) throw new Error("injected render fault"); return <SceneLayer>'), /render step 2:.*injected render fault/],
    ['present-initial-error', async d => {
      await replace(d, 'src/presentations/how-to-make-a-presentation/Talk.tsx', 'initialMode="browse"', 'initialMode="present"')
      await replace(d, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', 'return <SceneLayer>', 'if (beat === 1) console.error("injected present fault"); return <SceneLayer>')
    }, /render step 0:.*injected present fault/],
    ['transition', async d => replace(d, 'src/presentation-kit/usePresentationNav.ts', 'clampIndex(i + 1, count)', 'clampIndex(i, count)'), /render step 1/],
  ]
  for (const [name, inject, message] of cases) {
    const directory = await copyApp()
    try {
      await inject(directory)
      const result = command(directory, ['npm', 'run', 'verify'])
      expect(result.status, name).not.toBe(0)
      expect(result.output, name).toContain('FAIL verify')
      expect(result.output, name).toMatch(message)
      expect(result.output, name).not.toContain('PASS verify')
      if (name !== 'build') assertCleaned(result.output)
      console.log(`fault ${name}: expected failure\n${result.output}`)
    } finally { await remove(directory) }
  }
})

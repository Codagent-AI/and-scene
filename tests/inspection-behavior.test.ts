import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile, spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { promisify } from 'node:util'
import { chromium } from 'playwright'
import { expect, it } from 'vitest'
import { createAppFixture } from './helpers/app-fixture'

const exec = promisify(execFile)

it('INT-002 captures settled steps and diagnoses nested text, allowed overlaps, active chrome, and attribution', async () => {
  const root = process.cwd()
  const directory = await mkdtemp(join(tmpdir(), 'and-scene-inspection-'))
  try {
    await cp(join(root, 'skills/presentation/templates/bootstrap'), directory, { recursive: true })
    await cp(join(root, 'scripts/inspect-presentation.mjs'), join(directory, 'scripts/inspect-presentation.mjs'))
    await symlink(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir')
    await writeFile(join(directory, 'src/presentations/index.ts'), `export const presentations = [{slug: 'fixture', title: 'Inspection fixture', load: () => import('./Fixture')} ]`)
    await cp(join(root, 'tests/fixtures/inspection-scene.tsx'), join(directory, 'src/presentations/Fixture.tsx'))
    await exec('npm', ['run', 'build'], { cwd: directory })
    const result = await exec('node', ['scripts/inspect-presentation.mjs', 'fixture'], { cwd: directory, timeout: 30000 })
    const output = result.stdout + result.stderr
    expect(output).toMatch(/VISUAL WARNING step 2: unmarked visible text\/chrome overlap/)
    expect(output).toMatch(/VISUAL WARNING step 2: active progress/)
    expect(output).toMatch(/VISUAL WARNING step 2: attribution/)
    expect(output).not.toMatch(/VISUAL WARNING step (1|3):/)
    const screenshots = join(directory, 'inspection/fixture')
    expect(await readdir(screenshots)).toEqual(['01.png', '02.png', '03.png'])

    // Compare the helper's artifacts with independently settled browser views.
    const preview = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4274', '--strictPort'], { cwd: directory, stdio: 'ignore' })
    const exited = once(preview, 'exit')
    try {
      const url = 'http://127.0.0.1:4274/fixture'
      for (let attempt = 0; attempt < 40; attempt++) {
        try { if ((await fetch(url)).ok) break } catch { /* starting */ }
        await delay(100)
      }
      const browser = await chromium.launch({ headless: true })
      try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
        await page.goto(url, { waitUntil: 'networkidle' })
        for (let index = 0; index < 3; index++) {
          if (index) await page.keyboard.press('ArrowRight')
          await page.getByText('Settled step ' + (index + 1), { exact: true }).waitFor()
          const expected = await page.screenshot({ fullPage: true })
          expect((await readFile(join(screenshots, '0' + (index + 1) + '.png'))).equals(expected)).toBe(true)
        }
      } finally { await browser.close() }
    } finally {
      if (preview.exitCode === null && preview.signalCode === null) preview.kill('SIGTERM')
      await exited
    }
  } finally { await rm(directory, { recursive: true, force: true }) }
}, 60000)

it('keeps reference step-card text clear of the scene-kit label', async () => {
  const directory = await createAppFixture('and-scene-reference-inspection-')
  try {
    await exec('npm', ['run', 'build'], { cwd: directory })
    const result = await exec('node', ['scripts/inspect-presentation.mjs', 'how-to-make-a-presentation'], { cwd: directory, timeout: 30000 })
    expect(result.stdout + result.stderr).not.toContain('unmarked visible text/chrome overlap')
  } finally { await rm(directory, { recursive: true, force: true }) }
}, 60000)

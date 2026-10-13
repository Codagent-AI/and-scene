import { spawn } from 'node:child_process'
import { cp, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { expect, it, onTestFinished } from 'vitest'

async function run(dir: string, args: string[]) {
  return new Promise<{ code: number; output: string }>((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/inspect-presentation.mjs', ...args], {
      cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
    })
    onTestFinished(async () => {
      if (child.exitCode !== null || child.signalCode !== null) return
      try { process.kill(-child.pid!, 'SIGTERM') } catch { /* already exited */ }
      await new Promise<void>(resolve => child.once('close', () => resolve()))
    })
    let output = ''
    child.stdout.on('data', data => { output += data })
    child.stderr.on('data', data => { output += data })
    child.on('error', reject)
    const timer = setTimeout(() => { process.kill(-child.pid!, 'SIGTERM') }, 90000)
    child.on('close', code => { clearTimeout(timer); resolve({ code: code ?? 1, output }) })
  })
}

it('INT-002 captures settled steps, diagnoses defects, exempts marked overlap, and keeps warnings advisory', async () => {
  const root = process.cwd()
  const dir = resolve(`.artifacts/integration/inspect-${crypto.randomUUID()}`)
  await mkdir(dir, { recursive: true })
  onTestFinished(async () => { await rm(dir, { recursive: true, force: true }) })
  try {
    for (const name of ['src', 'scripts', 'package.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) {
      await cp(join(root, name), join(dir, name), { recursive: true })
    }
    await symlink(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
    await cp('tests/fixtures/inspection', join(dir, 'src/presentations/inspection-fixture'), { recursive: true })
    const talk = join(dir, 'src/presentations/inspection-fixture/Talk.tsx')
    await writeFile(talk, (await readFile(talk, 'utf8')).replaceAll('../../../src/presentation-kit/', '../../presentation-kit/'))
    const registry = join(dir, 'src/presentations/index.ts')
    await writeFile(registry, (await readFile(registry, 'utf8')).replace('\n]\n', "\n  { slug: 'inspection-fixture', title: 'Fixture', load: () => import('./inspection-fixture/Talk') },\n]\n"))
    for (const [slug, component] of [['missing-hooks', 'MissingHooks'], ['stalled-navigation', 'StalledNavigation'], ['crashing-scene', 'CrashingScene']]) {
      await writeFile(registry, (await readFile(registry, 'utf8')).replace('\n]\n', `\n  { slug: '${slug}', title: '${component}', load: () => import('./inspection-fixture/Failures').then(module => ({ default: module.${component} })) },\n]\n`))
    }
    const result = await run(dir, ['inspection-fixture', '--settle', '650'])
    expect(result.code, result.output).toBe(0)
    expect(await readdir(join(dir, '.inspection/inspection-fixture'))).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    for (let step = 1; step <= 3; step++) {
      expect(result.output).toMatch(new RegExp(`WARN step ${step}: overlap between .*SETTLED collision A.*collision B`))
      expect(result.output).toContain(`WARN step ${step}: indistinct active progress`)
      expect(result.output).toContain(`WARN step ${step}: indistinct active ToC`)
      expect(result.output).toContain(`WARN step ${step}: attribution`)
    }
    expect(result.output).toContain('WARN step 1: attribution too small')
    expect(result.output).toContain('WARN step 2: attribution browser-default')
    expect(result.output).toContain('WARN step 3: attribution missing link')
    expect(result.output).not.toMatch(/WARN.*allowed [AB]/)
    expect(result.output).not.toContain('UNSETTLED')
    // Decode the real screenshots in Chromium: the delayed scene indicator must be green.
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      for (let step = 1; step <= 3; step++) {
        const png = await readFile(join(dir, `.inspection/inspection-fixture/step-0${step}.png`))
        const pixel = await page.evaluate(async base64 => {
          const img = new Image()
          img.src = `data:image/png;base64,${base64}`
          await img.decode()
          const canvas = document.createElement('canvas')
          canvas.width = img.width; canvas.height = img.height
          const context = canvas.getContext('2d')!
          context.drawImage(img, 0, 0)
          // Stage is centered in the space right of the wide ToC (scale = 1).
          return [...context.getImageData(700, 500, 1, 1).data]
        }, png.toString('base64'))
        expect(pixel).toEqual([0, 255, 0, 255])
      }
    } finally { await browser.close() }
    const baseline = await run(dir, ['how-to-make-a-presentation'])
    expect(baseline.code, baseline.output).toBe(0)
    expect(baseline.output).not.toContain('WARN')
    expect(await readdir(join(dir, '.inspection/how-to-make-a-presentation'))).toHaveLength(9)
    const narrow = await run(dir, ['how-to-make-a-presentation', '--viewport', '390x844'])
    expect(narrow.code, narrow.output).toBe(0)
    expect(narrow.output).not.toContain('WARN')
    const missing = await run(dir, ['unknown-route'])
    expect(missing.code).not.toBe(0)
    expect(missing.output).toContain('FAIL')
    for (const slug of ['missing-hooks', 'stalled-navigation', 'crashing-scene']) {
      const fault = await run(dir, [slug, '--settle', '650'])
      expect(fault.code, fault.output).not.toBe(0)
      expect(fault.output).toContain('FAIL')
      expect(fault.output).not.toContain('PASS captured')
      if (slug === 'crashing-scene') expect(fault.output).toContain('injected inspection crash')
    }
    const badOptions = await run(dir, ['inspection-fixture', '--settle', '-1'])
    expect(badOptions.code).not.toBe(0)
    expect(badOptions.output).toContain('FAIL')
  } finally { await rm(dir, { recursive: true, force: true }) }
})

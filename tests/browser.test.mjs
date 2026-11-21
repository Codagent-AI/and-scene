import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { cp, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { reference } from '../scripts/reference.mjs'
import { withPreview } from '../scripts/preview.mjs'
import { inspectStep } from '../scripts/visual-diagnostics.mjs'
import { assertStyleNeutralSource } from './style-contract.mjs'

const source = path.resolve(import.meta.dirname, '..')
const bootstrap = path.join(source, 'skills/presentation/templates/bootstrap')
const sample = 'src/presentations/how-to-make-a-presentation'
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

async function temporary(t, name) {
  const destination = await mkdtemp(path.join(tmpdir(), `and-scene-${name}-`))
  t.after(() => rm(destination, { recursive: true, force: true }))
  return destination
}

function run(cwd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(npm, args, { cwd, shell: process.platform === 'win32' })
    let output = ''
    child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk })
    child.stderr.setEncoding('utf8').on('data', chunk => { output += chunk })
    child.once('error', reject)
    child.once('close', (code, signal) => resolve({ code, signal, output }))
  })
}

async function copyProject(t, label) {
  const folder = await temporary(t, label)
  const files = ['package.json', 'index.html', 'vite.config.ts', ...['', '.app', '.node'].map(suffix => `tsconfig${suffix}.json`), 'src', 'scripts']
  await Promise.all(files.map(file => cp(path.join(source, file), path.join(folder, file), { recursive: true })))
  await symlink(path.join(source, 'node_modules'), path.join(folder, 'node_modules'), 'junction')
  return folder
}

async function edit(folder, file, original, replacement) {
  const filename = path.join(folder, file)
  const text = await readFile(filename, 'utf8')
  assert.ok(text.includes(original), `Fault injection anchor missing in ${file}`)
  await writeFile(filename, text.replace(original, replacement))
}

async function compareDirectories(first, second) {
  const files = async directory => (await readdir(directory, { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile()).map(entry => path.relative(directory, path.join(entry.parentPath, entry.name))).sort()
  const expected = await files(first)
  assert.deepEqual(await files(second), expected, 'Template file list differs from the canonical directory')
  for (const file of expected) {
    assert.deepEqual(await readFile(path.join(second, file)), await readFile(path.join(first, file)), `Template differs: ${file}`)
  }
}

test('INT-001 materialized bootstrap is complete and style-neutral', { timeout: 180_000 }, async t => {
  const outside = await temporary(t, 'bootstrap')
  const app = path.join(outside, 'presentations')
  await writeFile(path.join(outside, 'package.json'), JSON.stringify({ private: true, workspaces: ['presentations'] }))
  await cp(bootstrap, app, { recursive: true })
  const install = await run(app, ['ci', '--workspaces=false', '--prefer-offline', '--no-audit'])
  assert.equal(install.code, 0, install.output)
  await assert.rejects(stat(path.join(outside, 'package-lock.json')), { code: 'ENOENT' })
  await stat(path.join(app, 'node_modules/vite/bin/vite.js'))

  const packageData = JSON.parse(await readFile(path.join(app, 'package.json'), 'utf8'))
  const lock = JSON.parse(await readFile(path.join(app, 'package-lock.json'), 'utf8'))
  assert.deepEqual(lock.packages[''].dependencies, packageData.dependencies)
  assert.deepEqual(lock.packages[''].devDependencies, packageData.devDependencies)
  for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) {
    assert.ok(packageData.dependencies[dependency], dependency)
  }
  for (const dependency of [
    'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node',
    'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh',
    'globals', 'playwright',
  ]) {
    assert.ok(packageData.devDependencies[dependency], dependency)
  }
  for (const dependency of [...Object.keys(packageData.dependencies), ...Object.keys(packageData.devDependencies)]) {
    assert.doesNotMatch(dependency, /tailwind|bootstrap|styled-components/)
  }
  assert.doesNotMatch(await readFile(path.join(app, 'vite.config.ts'), 'utf8'), /tailwind/i)
  const src = path.join(app, 'src')
  const files = await readdir(src, { recursive: true, withFileTypes: true })
  const paths = files.filter(file => file.isFile())
    .map(file => path.relative(src, path.join(file.parentPath, file.name)))
  assert.deepEqual(paths.filter(file => /\.(css|less|sass|scss|styl)$/i.test(file)), ['index.css'])
  assert.match(await readFile(path.join(src, 'index.css'), 'utf8'), /^body\s*\{\s*margin:\s*0;\s*\}\s*$/)
  const sources = paths.filter(file => /\.[jt]sx?$/.test(file))
  for (const file of sources) {
    assertStyleNeutralSource(file, await readFile(path.join(src, file), 'utf8'))
  }
  console.log(`INT-001: checked ${sources.length} bootstrap and kit source files for geometry-only inline defaults and no visual stylesheets.`)
  await compareDirectories(path.join(source, 'src/presentation-kit'), path.join(app, 'src/presentation-kit'))
  await compareDirectories(path.join(source, 'scripts'), path.join(app, 'scripts'))
  const lint = await run(outside, ['--prefix', app, '--workspaces=false', 'run', 'lint'])
  assert.equal(lint.code, 0, lint.output)
  const verify = await run(outside, ['--prefix', app, '--workspaces=false', 'run', 'verify'])
  assert.equal(verify.code, 0, verify.output)
  assert.match(verify.output, /Verified starter at step index 0/)
  assert.match(verify.output, /Verified starter at step index 1/)
  assert.match(verify.output, /Verification passed\./)
  console.log('INT-001: installed from the bundled lockfile outside the source, linted, confirmed dependencies, no visual defaults, and byte parity.')
  console.log(verify.output.trim())
})

test('INT-002 local inspection captures settled screenshots and advisory diagnostics', { timeout: 75_000 }, async t => {
  const app = await copyProject(t, 'inspection')
  await writeFile(path.join(app, `${sample}/Talk.tsx`), `
    import { useState } from 'react'
    import { Presentation, SceneLayer } from '../../presentation-kit'
    import type { SceneProps, Step } from '../../presentation-kit'
    import './presentation.css'

    function Fixture({ payload }: SceneProps<boolean>) {
      const [settled, setSettled] = useState(false)
      return <SceneLayer>
        {!payload && <>
          <span className="collision">Unmarked one</span>
          <span className="collision">Unmarked two</span>
        </>}
        <div data-presentation-allow-overlap="" className="allowed">
          <span>Allowed one</span><span>Allowed two</span>
        </div>
        <span className="settled-anchor">Settled anchor</span>
        {payload && !settled && <span className="transient" onAnimationEnd={() => setSettled(true)}>Transient overlay</span>}
      </SceneLayer>
    }

    const steps: Step<boolean>[] = [
      { id: 'one', title: 'Initial', era: 'First', caption: 'First caption', payload: false, groupKey: 'fixture', Scene: Fixture },
      { id: 'two', title: 'Settled', era: 'Later', caption: 'Second caption', payload: true, groupKey: 'fixture', Scene: Fixture },
    ]

    export default function Talk() {
      return <Presentation title="Diagnostic fixture" steps={steps} />
    }
  `)
  await writeFile(path.join(app, `${sample}/presentation.css`), `
    .collision { position: absolute; left: 75px; top: 80px; }
    .allowed { position: absolute; left: 75px; top: 130px; }
    .allowed span { position: absolute; white-space: nowrap; }
    .settled-anchor, .transient { position: absolute; top: 240px; left: 75px; }
    .transient { animation: fixture-settle 550ms linear both; }
    @keyframes fixture-settle { from { opacity: 1; } to { opacity: 0.8; } }
    [data-presentation-era], [data-presentation-progress-step] { width: 70px; height: 24px; }
    [data-step-index="1"] [data-presentation-active] { background: darkgreen; color: white; }
    [data-presentation-attribution] { font-size: 8px; }
  `)

  const settleMs = 850
  const result = await run(app, ['run', 'inspect', '--', reference.slug, '--settle-ms', String(settleMs)])
  assert.equal(result.code, 0, result.output)
  assert.match(result.output, /Advisory at step 1.+Overlap:.*Unmarked one.*Unmarked two/)
  assert.match(result.output, /Advisory at step 1.+Indistinct active progress indicator/)
  assert.match(result.output, /Advisory at step 1.+Indistinct active table of contents/)
  assert.match(result.output, /Advisory at step 1.+Attribution.+\[data-presentation-attribution\]/)
  assert.doesNotMatch(result.output, /Overlap:.+(Allowed one|Allowed two|Transient overlay)/)
  assert.doesNotMatch(result.output, /Advisory at step 2.+Indistinct active/)
  const directory = path.join(app, '.presentation-inspection', reference.slug, '1440x900')
  const screenshots = (await readdir(directory)).sort()
  assert.deepEqual(screenshots, ['step-01.png', 'step-02.png'])
  for (const file of screenshots) {
    const screenshot = await readFile(path.join(directory, file))
    assert.equal(screenshot.toString('ascii', 1, 4), 'PNG')
    assert.deepEqual([screenshot.readUInt32BE(16), screenshot.readUInt32BE(20)], [1440, 900])
  }
  const [first, second] = await Promise.all(screenshots.map(file => stat(path.join(directory, file))))
  assert.ok(second.mtimeMs - first.mtimeMs >= settleMs - 20, 'Second screenshot was captured before the configured settle interval')
  console.log(`INT-002: 2 PNGs at 1440 × 900, ${Math.round(second.mtimeMs - first.mtimeMs)}ms apart. Intentional and transient overlaps absent from diagnostics.`)
  console.log(result.output.trim())
})

test('E2E-001 reference presentation passes production verification', { timeout: 75_000 }, async () => {
  const result = await run(source, ['run', 'verify'])
  assert.equal(result.code, 0, result.output)
  assert.match(result.output, /Preview ready at http:\/\/127\.0\.0\.1:\d+/)
  const steps = [...result.output.matchAll(/Verified how-to-make-a-presentation at step index (\d+): (.+)/g)]
  assert.deepEqual(steps.map(match => [Number(match[1]), match[2]]), reference.steps.map((step, index) => [index, step[1]]))
  assert.match(result.output, /Verification passed\./)
  console.log(result.output.trim())

  await withPreview(source, async ({ browser, origin }) => {
    const route = `${origin}/${reference.slug}`
    const wide = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await wide.goto(route)
    await wide.getByRole('button', { name: 'the reveal', exact: true }).click()
    await wide.locator('[data-step-index="8"]').waitFor()
    await wide.waitForTimeout(800)
    await wide.evaluate(() => document.activeElement.blur())
    await wide.keyboard.press('p')
    await wide.locator('[data-step-index="8"][data-presentation-mode="present"]').waitFor()
    await wide.waitForTimeout(1000)
    const geometry = await wide.evaluate(() => {
      const canvas = document.querySelector('[data-presentation-canvas]')
      const box = canvas.getBoundingClientRect()
      const outside = [...canvas.querySelectorAll('[data-presentation-entity]')].filter(entity => {
        const { top, right, bottom, left } = entity.getBoundingClientRect()
        return top < box.top - 2 || right > box.right + 2 || bottom > box.bottom + 2 || left < box.left - 2
      }).map(entity => entity.getAttribute('data-presentation-entity'))
      return { outside, scrollWidth: document.documentElement.scrollWidth }
    })
    assert.deepEqual(geometry.outside, [], 'Present-mode entities escaped the final canvas')
    assert.ok(geometry.scrollWidth <= 1440, 'Present-mode scene causes horizontal overflow')
    await wide.close()

    const narrow = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await narrow.goto(route)
    await narrow.getByRole('button', { name: /^Step 5:/ }).click()
    await narrow.locator('[data-step-index="4"]').waitFor()
    await narrow.waitForTimeout(800)
    const smallText = (await narrow.evaluate(inspectStep)).filter(warning => warning.startsWith('Small scene text:'))
    assert.deepEqual(smallText, [], 'Dense scene labels are too small in the fitted narrow canvas')
    await narrow.close()
  })
})

test('E2E-002 verification failures identify the phase and clean up production preview', { timeout: 210_000 }, async t => {
  const stepsFile = `${sample}/steps/index.ts`
  const cases = [
    {
      name: 'build failure',
      fault: folder => edit(folder, stepsFile, 'payload: 1', 'payload: "wrong type"'),
      expected: /Verification failed: Build failed/,
      preview: false,
    },
    {
      name: 'missing sample',
      fault: folder => edit(folder, 'src/presentations/index.ts', 'slug: \'how-to-make-a-presentation\'', 'slug: "different-slug"'),
      expected: /Verification failed: Reference sample missing or malformed in registry/,
    },
    {
      name: 'malformed outline',
      fault: folder => edit(folder, stepsFile, 'You have a topic', 'Reordered sample title'),
      expected: /Verification failed: Reference sample title or caption differs at step index 0/,
    },
    {
      name: 'console error during a step',
      fault: folder => edit(folder, `${sample}/steps/Workshop.tsx`, 'SceneProps<Beat>) {', 'SceneProps<Beat>) {\n  if (beat === 3) console.error("fixture browser error")'),
      expected: /Verification failed: Render failed at step index 2: console.error: fixture browser error/,
    },
    {
      name: 'transition fails to advance',
      fault: folder => edit(folder, 'src/presentation-kit/usePresentationNav.ts', "'ArrowRight'", "'ArrowDown'"),
      expected: /Verification failed: Transition failed at step index 1: public step index did not advance/,
    },
  ]

  for (const [index, { name, fault, expected, preview = true }] of cases.entries()) {
    await t.test(name, async subtest => {
      const folder = await copyProject(subtest, `fault-${index}`)
      await fault(folder)
      const result = await run(folder, ['run', 'verify'])
      assert.equal(result.code, 1, result.output)
      assert.match(result.output, expected)
      assert.doesNotMatch(result.output, /Verification passed\./)
      const started = result.output.match(/Preview ready at (http:\/\/127\.0\.0\.1:\d+) \(pid (\d+)\)/)
      if (preview) {
        assert.ok(started, result.output)
        assert.throws(() => process.kill(Number(started[2]), 0), { code: 'ESRCH' })
        await assert.rejects(fetch(started[1], { signal: AbortSignal.timeout(1000) }))
      } else {
        assert.equal(started, null)
      }
      console.log(`E2E-002 ${name}: ${result.output.match(expected)[0]}. ${preview ? 'Preview process and port cleared.' : 'Preview was not started.'}`)
    })
  }
})

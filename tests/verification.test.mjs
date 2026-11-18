import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const source = resolve(import.meta.dirname, '..')
const slug = 'how-to-make-a-presentation'
const talk = `src/presentations/${slug}/Talk.tsx`
async function checkout() {
  const directory = await mkdtemp(join(tmpdir(), 'and-scene-browser-'))
  for (const name of ['package.json', 'package-lock.json', 'index.html', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'src', 'scripts', 'public']) {
    await cp(join(source, name), join(directory, name), { recursive: true })
  }
  await symlink(join(source, 'node_modules'), join(directory, 'node_modules'), 'dir')
  return directory
}
async function command(cwd, script, args = []) {
  try {
    const result = await exec('npm', ['run', script, '--', ...args], { cwd, timeout: 180000, maxBuffer: 8 * 1024 * 1024 })
    return { code: 0, output: result.stdout + result.stderr }
  } catch (error) {
    return { code: error.code, output: (error.stdout || '') + (error.stderr || '') }
  }
}
function assertStopped(output) {
  const match = output.match(/pid=(\d+)/)
  if (!match) return
  assert.match(output, /preview stopped/)
  assert.throws(() => process.kill(Number(match[1]), 0), /ESRCH/)
}

test('E2E-001: reference presentation passes production verification', { timeout: 180000 }, async () => {
  const directory = await checkout()
  try {
    const result = await command(directory, 'verify')
    assert.equal(result.code, 0, result.output)
    assert.match(result.output, /PASS: build/)
    assert.match(result.output, /preview host\/readiness: http:\/\/127\.0\.0\.1:/)
    assert.match(result.output, new RegExp(`browser URL: http://127\\.0\\.0\\.1:\\d+/${slug}`))
    for (let i = 0; i < 9; i++) assert.match(result.output, new RegExp(`render step ${i}/8: clean`))
    assertStopped(result.output)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('E2E-002: verification failures are actionable', { timeout: 720000 }, async (t) => {
  const faults = [
    ['build-breaking edit', async (dir) => writeFile(join(dir, 'src/broken.ts'), 'const broken: string = 42; export { broken }'), /FAIL \[build\]/],
    ['missing reference', async (dir) => {
      const registry = join(dir, 'src/presentations/index.ts')
      await writeFile(registry, (await readFile(registry, 'utf8')).split('\n').filter((line) => !line.includes("slug: 'how-to-make-a-presentation'")).join('\n'))
    }, /FAIL \[sample\].*missing from registry/],
    ['out-of-order reference', async (dir) => {
      const outline = join(dir, `src/presentations/${slug}/outline.ts`)
      const lines = (await readFile(outline, 'utf8')).split('\n')
      const first = lines.findIndex((line) => line.includes('You have a topic'))
      ;[lines[first], lines[first + 1]] = [lines[first + 1], lines[first]]
      await writeFile(outline, lines.join('\n'))
    }, /FAIL \[sample\].*step 0/],
    ['console error at step 0', async (dir) => {
      await writeFile(join(dir, talk), (await readFile(join(dir, talk), 'utf8')) + '\nconsole.error("injected console failure")\n')
    }, /FAIL \[render\].*step 0.*injected console failure/],
    ['uncaught runtime error at step 2', async (dir) => {
      await writeFile(join(dir, talk), (await readFile(join(dir, talk), 'utf8')) + '\nlet injectedPresses = 0; window.addEventListener("keydown", (event) => { if (event.key === "ArrowRight" && ++injectedPresses === 2) setTimeout(() => { throw new Error("injected runtime failure") }, 10) })\n')
    }, /FAIL \[render\].*step 2.*injected runtime failure/],
    ['stalled transition to step 1', async (dir) => {
      await writeFile(join(dir, talk), (await readFile(join(dir, talk), 'utf8')) + '\nwindow.addEventListener("keydown", (event) => { if (event.key === "ArrowRight") event.stopImmediatePropagation() }, true)\n')
    }, /FAIL \[render\].*transition step 1/],
  ]
  for (const [name, inject, failure] of faults) await t.test(name, async () => {
    const directory = await checkout()
    try {
      await inject(directory)
      const result = await command(directory, 'verify')
      assert.notEqual(result.code, 0, result.output)
      assert.match(result.output, failure)
      assert.doesNotMatch(result.output, /PASS:/)
      assertStopped(result.output)
    } finally { await rm(directory, { recursive: true, force: true }) }
  })
})

test('INT-002: screenshot helper emits faithful settled artifacts and advisory warnings', { timeout: 180000 }, async () => {
  const directory = await checkout()
  try {
    await writeFile(join(directory, talk), `import { useEffect, useState } from 'react'
export default function Controlled() {
  const [index, setIndex] = useState(0)
  useEffect(() => { const next = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') setIndex((i) => Math.min(1, i + 1)) }; window.addEventListener('keydown', next); return () => window.removeEventListener('keydown', next) }, [])
  return <main data-step-count="2" data-step-index={index} style={{minHeight:'100vh'}}>
    <style>{'body { margin:0; font-family:Arial } .collision { position:absolute; top:100px; left:100px } .allowed { position:absolute; top:200px; left:100px } [data-presentation-progress] { position:absolute; top:300px } @keyframes settle { from { opacity:0.1 } to { opacity:1 } } .animated { animation:settle 300ms linear }'}</style>
    <div className="collision" data-testid="collision-a">Visible collision {index}</div><div className="collision" data-testid="collision-b">Visible collision {index}</div>
    <div data-presentation-allow-overlap><span className="allowed" data-testid="allowed-a">Readable allowed</span><span className="allowed" data-testid="allowed-b">Readable allowed</span></div>
    <nav data-presentation-progress aria-label="progress"><button aria-current="step">active</button><button>inactive</button></nav>
    <a data-presentation-attribution href="https://github.com/Codagent-AI/and-scene" style={{position:'absolute',top:400,fontSize:8}}>made by and-scene</a>
    <div key={index} className="animated" style={{position:'absolute',top:500}}>Step {index}</div>
  </main>
}`)
    const result = await command(directory, 'inspect', [slug, '--settle', '650'])
    assert.equal(result.code, 0, result.output)
    const artifacts = join(directory, `artifacts/inspection/${slug}/1440x900`)
    assert.deepEqual((await readdir(artifacts)).sort(), ['manifest.json', 'step-01.png', 'step-02.png'])
    const manifest = JSON.parse(await readFile(join(artifacts, 'manifest.json'), 'utf8'))
    assert.equal(manifest.length, 2)
    for (let index = 0; index < 2; index++) {
      assert.equal(manifest[index].index, index)
      assert.ok(manifest[index].settledForMs >= 650)
      assert.equal(manifest[index].activeAnimations, 0, 'finite fixture animation has settled before capture')
      assert.match(result.output, new RegExp(`ADVISORY step ${index}: overlap: collision-a / collision-b`))
      assert.match(result.output, new RegExp(`ADVISORY step ${index}: indistinct active navigation`))
      assert.match(result.output, new RegExp(`ADVISORY step ${index}: attribution undersized or browser-default: style \\[data-presentation-attribution\\]`))
      assert.doesNotMatch(manifest[index].warnings.join('\n'), /allowed-a|allowed-b/)
      const image = await readFile(join(artifacts, manifest[index].image))
      assert.equal(image.subarray(1, 4).toString(), 'PNG')
      assert.equal(image.readUInt32BE(16), 1440)
    }
    assert.notDeepEqual(await readFile(join(artifacts, 'step-01.png')), await readFile(join(artifacts, 'step-02.png')))
    assert.match(result.output, /warnings are advisory, not visual-quality pass\/fail/)
    assertStopped(result.output)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

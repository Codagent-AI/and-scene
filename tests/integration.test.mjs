import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, cp, readFile, writeFile, readdir, rm, symlink, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { inspectPresentation } from '../scripts/inspect-presentation.mjs'
const root = resolve(import.meta.dirname, '..')
const selected = process.env.TEST_CASE
function scenario(name, work) { test(name, { skip: selected && !name.includes(selected), timeout: 720000 }, work) }
async function run(cwd, command, args, expected = 0) {
  const result = await new Promise((resolveResult, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', data => { output += data }); child.stderr.on('data', data => { output += data })
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`command timed out: ${command} ${args.join(' ')}`)) }, 180000)
    child.on('error', reject)
    child.on('exit', code => { clearTimeout(timer); resolveResult({ code, output }) })
  })
  console.log(`COMMAND ${command} ${args.join(' ')}\n${result.output}`)
  if (expected === 0) assert.equal(result.code, 0, result.output)
  else assert.notEqual(result.code, 0, result.output)
  for (const [, pid] of result.output.matchAll(/preview cleaned pid=(\d+)/g)) assert.throws(() => process.kill(Number(pid), 0), 'preview child must be gone')
  return result
}
async function disposable(work, { bootstrap = false } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'and-scene-'))
  try {
    if (bootstrap) await cp(join(root, 'skills/presentation/templates/bootstrap'), directory, { recursive: true })
    else {
      for (const path of ['src', 'scripts', 'index.html', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js']) await cp(join(root, path), join(directory, path), { recursive: true })
      await symlink(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir')
    }
    return await work(directory)
  } finally { await rm(directory, { recursive: true, force: true }) }
}
async function compareTree(a, b) {
  const entries = await readdir(a, { withFileTypes: true })
  assert.deepEqual((await readdir(b)).sort(), entries.map(e => e.name).sort())
  for (const entry of entries) {
    if (entry.isDirectory()) await compareTree(join(a, entry.name), join(b, entry.name))
    else assert.deepEqual(await readFile(join(a, entry.name)), await readFile(join(b, entry.name)), `byte parity ${entry.name}`)
  }
}
scenario('INT-001 materialized bootstrap complete style-neutral and byte-aligned', async () => {
  await disposable(async directory => {
    console.log(`materialized outside repository: ${directory}`)
    const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) assert.ok(pkg.dependencies[dependency])
    for (const dependency of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']) assert.ok(pkg.devDependencies[dependency])
    assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
    for (const file of ['src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts', 'vite.config.ts']) assert.ok((await stat(join(directory, file))).isFile())
    await compareTree(join(root, 'src/presentation-kit'), join(directory, 'src/presentation-kit'))
    await compareTree(join(root, 'scripts'), join(directory, 'scripts'))
    const css = await readFile(join(directory, 'src/index.css'), 'utf8')
    assert.ok(!/color|font|border|shadow|padding|margin|--/.test(css), 'bootstrap has no visual defaults')
    await run(directory, 'npm', ['ci', '--no-audit', '--no-fund'])
    await run(directory, 'npm', ['run', 'verify'])
  }, { bootstrap: true })
})
scenario('E2E-001 reference passes complete production verification', async () => {
  const result = await run(root, 'npm', ['run', 'verify'])
  assert.match(result.output, /PASS verify how-to-make-a-presentation/)
  assert.match(result.output, /127\.0\.0\.1/)
  assert.equal([...result.output.matchAll(/render step \d+: PASS/g)].length, 9)
})
scenario('E2E-002 verification failures identify phases steps and clean preview children', async () => {
  const faults = [
    ['build', 'src/main.tsx', s => s + '\nconst broken: number = "wrong"; console.log(broken)\n', /FAIL build/],
    ['missing', 'src/presentations/index.ts', s => s.replace("slug: 'how-to-make-a-presentation'", "slug: 'removed'"), /FAIL render: sample: registered presentation missing/],
    ['order', 'src/presentations/how-to-make-a-presentation/outline.json', s => JSON.stringify(JSON.parse(s).reverse()), /sample step 0: id/],
    ['console', 'src/presentations/how-to-make-a-presentation/steps/index.tsx', s => s.replace('  return <SceneLayer>', '  if (payload.beat === 2) console.error("injected console failure")\n  return <SceneLayer>'), /render step 2: console: injected console failure/],
    ['pageerror', 'src/presentations/how-to-make-a-presentation/steps/index.tsx', s => s.replace('  return <SceneLayer>', '  if (payload.beat === 3) setTimeout(() => { throw new Error("injected page failure") }, 30)\n  return <SceneLayer>'), /render step 3: pageerror: injected page failure/],
    ['render', 'src/presentations/how-to-make-a-presentation/steps/index.tsx', s => s.replace('  return <SceneLayer>', '  if (payload.beat === 3) throw new Error("injected render failure")\n  return <SceneLayer>'), /render step 3:.*injected render failure/],
    ['transition', 'src/presentation-kit/usePresentationNav.ts', s => s.replace('clamp(clamp(i, count) + 1, count)', 'clamp(i, count)'), /transition step 1: public index did not advance/],
  ]
  for (const [name, path, mutate, expected] of faults.filter(([name]) => !process.env.FAULT_CASE || process.env.FAULT_CASE === name)) await disposable(async directory => {
    console.log(`FAULT ${name}`)
    const filename = join(directory, path)
    await writeFile(filename, mutate(await readFile(filename, 'utf8')))
    const result = await run(directory, 'npm', ['run', 'verify'], 1)
    assert.match(result.output, expected)
    assert.ok(!/PASS verify/.test(result.output))
    if (name !== 'build') assert.match(result.output, /preview cleaned pid=/)
  })
})
const fixture = `import { useEffect, useState } from 'react'
export default function Talk() {
 const [index, setIndex] = useState(0)
 useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === 'ArrowRight') setIndex(i => Math.min(1, i + 1)) }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler) }, [])
 return <main style={{minHeight:900}} data-presentation-root="" data-step-count="2" data-step-index={index}>
 <style>{\`body{margin:0}.collision,.allowed{position:absolute;left:100px;top:100px;font:20px sans-serif}.second{left:110px}.allowed{top:200px}.nav{position:absolute;top:300px} .settling{position:absolute;top:400px;animation:arrive .6s forwards}@keyframes arrive{from{opacity:0}to{opacity:1}}\`}</style>
 <span className="collision">unmarked first</span><span className="collision second">unmarked second</span>
 <div data-presentation-allow-overlap=""><span className="allowed">allowed first</span><span className="allowed second">allowed second</span></div>
 <div className="nav"><nav data-presentation-progress=""><button data-presentation-active="true">active</button><button data-presentation-active="false">inactive</button></nav><nav data-presentation-toc=""><button data-presentation-active="true">section one</button><button data-presentation-active="false">section two</button></nav></div>
 <div key={index} className="settling">settled content {index}</div>
 <aside data-presentation-attribution="" style={{position:'absolute',top:600}}><a href="https://github.com/Codagent-AI/and-scene" style={{fontSize:9}}>made by and-scene</a></aside>
 </main>
}`
scenario('INT-002 inspection writes settled screenshots and advisory diagnostics with exemptions', async () => {
  await disposable(async directory => {
    await writeFile(join(directory, 'src/presentations/how-to-make-a-presentation/Talk.tsx'), fixture)
    await run(directory, 'npm', ['run', 'build'])
    const results = await inspectPresentation('how-to-make-a-presentation', { cwd: directory, build: false, settle: 900, onCapture: async ({ page, path }) => {
      assert.equal(await page.locator('.settling').evaluate(element => getComputedStyle(element).opacity), '1', 'captures must settle')
      assert.ok((await stat(path)).size > 1000)
      assert.deepEqual([...(await readFile(path)).subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
    } })
    assert.equal(results.length, 2)
    for (const [index, result] of results.entries()) {
      assert.equal(result.index, index)
      assert.ok(result.path.endsWith(`artifacts/inspection/how-to-make-a-presentation/step-0${index + 1}.png`))
      assert.ok(result.warnings.some(w => /overlap: unmarked/.test(w)))
      assert.ok(!result.warnings.some(w => /overlap:.*allowed/.test(w)))
      assert.ok(result.warnings.some(w => /indistinct active progress/.test(w)))
      assert.ok(result.warnings.some(w => /indistinct active toc/.test(w)))
      assert.ok(result.warnings.some(w => /unpolished attribution/.test(w)))
    }
  })
})

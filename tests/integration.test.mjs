import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const bootstrap = join(root, 'skills/presentation/templates/bootstrap')
const evidence = process.env.AND_SCENE_EVIDENCE
async function save(name, text) { if (evidence) { await mkdir(evidence, { recursive: true }); await writeFile(join(evidence, name + '.txt'), text) } }
async function run(cwd, args, name, expected = 0) {
  const result = await new Promise((resolve, reject) => {
    const child = spawn('npm', args, { cwd, env: { ...process.env, NO_COLOR: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''; child.stdout.on('data', b => output += b); child.stderr.on('data', b => output += b)
    const timer = setTimeout(() => child.kill('SIGTERM'), 100000)
    child.on('error', reject); child.on('close', code => { clearTimeout(timer); resolve({ code, output }) })
  })
  await save(name, `Command: npm ${args.join(' ')}\nCwd: ${cwd}\nExit: ${result.code}\n${result.output}`)
  assert.equal(result.code === 0, expected === 0, result.output)
  return result.output
}
async function files(dir, prefix = '') {
  const result = []
  for (const item of await readdir(join(dir, prefix), { withFileTypes: true })) {
    const name = join(prefix, item.name)
    result.push(...(item.isDirectory() ? await files(dir, name) : [name]))
  }
  return result.sort()
}
async function disposable(source = root, install = false) {
  const target = await mkdtemp(join(tmpdir(), 'and-scene-'))
  await cp(source, target, { recursive: true, filter: path => !['node_modules', '.git', 'dist', 'artifacts', 'openspec', 'skills'].includes(path.slice(source.length + 1).split('/')[0]) })
  if (!install) await symlink(join(root, 'node_modules'), join(target, 'node_modules'), 'dir')
  return target
}
async function assertStopped(output) {
  const starts = [...output.matchAll(/Preview ready (http:\/\/127\.0\.0\.1:\d+) \(pid (\d+)\)/g)]
  for (const [, url, pid] of starts) {
    assert.ok(output.includes(`Preview stopped ${url}`), output)
    assert.throws(() => process.kill(Number(pid), 0), { code: 'ESRCH' })
    await assert.rejects(fetch(url, { signal: AbortSignal.timeout(1000) }))
  }
}
test('INT-001 materialized bootstrap builds and verifies independently with aligned neutral kit', { timeout: 150000 }, async () => {
  const dir = await disposable(bootstrap, true)
  try {
    await run(dir, ['ci', '--no-audit', '--no-fund'], 'INT-001-install')
    const pkg = JSON.parse(await readFile(join(dir, 'package.json')))
    for (const dep of ['react','react-dom','motion','lucide-react','vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','globals','playwright']) assert.ok(pkg.dependencies?.[dep] || pkg.devDependencies?.[dep], dep)
    assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
    const canonical = join(root, 'src/presentation-kit'), materialized = join(dir, 'src/presentation-kit')
    assert.deepEqual(await files(canonical), await files(materialized))
    for (const name of await files(canonical)) {
      assert.equal(await readFile(join(canonical, name), 'utf8'), await readFile(join(materialized, name), 'utf8'), name)
      const source = await readFile(join(materialized, name), 'utf8')
      assert.doesNotMatch(source, /(?:backgroundColor|fontFamily|boxShadow|borderRadius|#[0-9a-fA-F]{3,8})\s*[:=]?/)
    }
    for (const name of await files(join(root, 'scripts'))) assert.equal(await readFile(join(root,'scripts', name), 'utf8'), await readFile(join(dir,'scripts', name), 'utf8'), `script parity ${name}`)
    assert.equal((await readFile(join(dir, 'src/index.css'), 'utf8')).trim(), '')
    const output = await run(dir, ['run', 'verify'], 'INT-001')
    assert.match(output, /PASS step 0/); assert.match(output, /PASS step 1/); assert.match(output, /PASS verification/)
    await assertStopped(output)
    await save('INT-001-contract', 'PASS INT-001: skill-relative bootstrap resolved using import.meta.url from tests; materialized outside source; npm ci; full dependency set; all kit and script files byte-aligned; no framework or kit visual defaults; neutral CSS; independent build and two-step route verification.\n')
  } finally { await rm(dir, { recursive: true, force: true }) }
})
test('INT-002 inspection captures settled steps and advisory collision active-state attribution diagnostics', { timeout: 150000 }, async () => {
  const dir = await disposable()
  try {
    const fixture = `import { useState } from 'react'
export default function Fixture() {
 const [index,setIndex] = useState(0)
 return <main style={{minHeight:"100vh"}} data-presentation="" data-step-count="2" data-step-index={index} onKeyDown={e => {if(e.key==='ArrowRight') setIndex(i => Math.min(1,i+1))}} tabIndex={-1} ref={el => el?.focus()}>
 <style>{'button{background:white;color:black;border:1px solid black;font:14px Arial} .moving{position:absolute;left:30px;top:100px;transition:left 60ms linear}.moving[data-step="1"]{left:100px}'}</style>
 <span style={{position:'absolute',left:20,top:20}}>collision-A</span><span style={{position:'absolute',left:20,top:20}}>collision-B</span>
 <div data-presentation-allow-overlap=""><span style={{position:'absolute',left:20,top:60}}>allowed-A</span><span style={{position:'absolute',left:20,top:60}}>allowed-B</span></div>
 <span className="moving" data-step={index}>settled-text</span><span style={{display:'none'}}>hidden-text</span>
 <div style={{position:'absolute',top:160}}><button data-presentation-progress-step="" data-presentation-active="true">one</button><button data-presentation-progress-step="" data-presentation-active="false">two</button></div>
 <div style={{position:'absolute',top:200}}><button data-presentation-toc-entry="" data-presentation-active="true">era one</button><button data-presentation-toc-entry="" data-presentation-active="false">era two</button></div>
 <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene" style={{position:'absolute',top:250,fontSize:8}}>made by and-scene</a>
 </main>
}`
    await mkdir(join(dir, 'src/presentations/fixture'))
    await writeFile(join(dir, 'src/presentations/fixture/Talk.tsx'), fixture)
    await writeFile(join(dir, 'src/presentations/index.ts'), `export const presentations = [{slug:'fixture', title:'Fixture', load: () => import('./fixture/Talk')}]\n`)
    const output = await run(dir, ['run', 'inspect', '--', 'fixture', '--settle', '150'], 'INT-002')
    const artifacts = join(dir, 'artifacts/inspection/fixture')
    assert.deepEqual((await readdir(artifacts)).sort(), ['report.json', 'step-01.png', 'step-02.png'])
    const report = JSON.parse(await readFile(join(artifacts, 'report.json')))
    assert.equal(report.steps.length, 2)
    for (const step of report.steps) {
      assert.ok(step.captured - step.arrived >= 150, JSON.stringify(step))
      const png = await readFile(join(artifacts, step.file))
      assert.equal(png.subarray(1, 4).toString(), 'PNG'); assert.equal(png.readUInt32BE(16), 1440); assert.equal(png.readUInt32BE(20), 900)
      const warnings = step.warnings.join('\n')
      assert.match(warnings, new RegExp(`Step ${step.index}: overlap.*collision-A.*collision-B`))
      assert.doesNotMatch(warnings, /allowed-A|allowed-B|hidden-text/)
      assert.match(warnings, /indistinct active progress/); assert.match(warnings, /indistinct active toc/)
      assert.match(warnings, /unpolished attribution.*data-presentation-attribution/)
    }
    assert.match(output, /visual warnings are advisory/)
    await assertStopped(output)
    await save('INT-002-contract', 'PASS INT-002: two named 1440x900 PNG artifacts; 150ms settle exceeds 60ms fixture transition; capture timestamps meet interval; unmarked text collisions warn; allowed and hidden texts do not warn; progress/ToC and attribution diagnostics identify each step; warning-bearing run exits zero; preview cleaned.\n' + JSON.stringify(report, null, 2))
  } finally { await rm(dir, { recursive: true, force: true }) }
})
test('E2E-001 reference presentation passes production verification', { timeout: 100000 }, async () => {
  const output = await run(root, ['run', 'verify'], 'E2E-001')
  for (let i = 0; i < 9; i++) assert.match(output, new RegExp(`PASS step ${i} http://127\\.0\\.0\\.1:\\d+/how-to-make-a-presentation data-step-count=9`))
  assert.match(output, /PASS verification: build, registration, metadata, all steps rendered/)
  assert.doesNotMatch(output, /localhost/)
  await assertStopped(output)
})
test('E2E-002 verification failures identify phase and step and clean up processes', { timeout: 400000 }, async t => {
  const faults = [
    ['build', 'src/presentations/how-to-make-a-presentation/metadata.ts', s => s + '\nexport const broken: number = "bad"\n', /phase=build/],
    ['missing', 'src/presentations/index.ts', () => "export const presentations: import('../routing').RegistryEntry[] = []\n", /phase=sample/],
    ['out-of-order', 'src/presentations/how-to-make-a-presentation/steps/index.ts', s => s.replace('[step1, step2', '[step2, step1'), /phase=sample step=9: Reference sample step 0/],
    ['console', 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', s => s.replace('return <SceneLayer>', 'if (payload.beat === 2) console.error("injected console fault"); return <SceneLayer>'), /phase=render step=1: console: injected console fault/],
    ['pageerror', 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', s => "import { useEffect } from 'react'\n" + s.replace('return <SceneLayer>', 'useEffect(() => { if (payload.beat === 2) setTimeout(() => { throw new Error("injected uncaught fault") }, 10) }, [payload.beat]); return <SceneLayer>'), /phase=render step=1: pageerror: injected uncaught fault/],
    ['render', 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', s => s.replace('return <SceneLayer>', 'if (payload.beat === 2) throw new Error("injected render fault"); return <SceneLayer>'), /phase=(render|transition) step=1/],
    ['stalled', 'src/presentation-kit/usePresentationNav.ts', s => s.replace('setIndex(i => clamp(i + 1, count))', 'setIndex(i => i)'), /phase=transition step=1/],
  ]
  for (const [name, path, mutate, message] of faults) await t.test(name, async () => {
    const dir = await disposable()
    try {
      await writeFile(join(dir, path), mutate(await readFile(join(dir, path), 'utf8')))
      const output = await run(dir, ['run', 'verify'], `E2E-002-${name}`, 1)
      assert.match(output, /FAIL verification/); assert.match(output, message)
      assert.doesNotMatch(output, /PASS verification:/)
      await assertStopped(output)
    } finally { await rm(dir, { recursive: true, force: true }) }
  })
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { materialize, templateRoot } from '../skills/presentation/bootstrap.mjs'
import { inspect } from '../scripts/inspect-presentation.mjs'
const root = fileURLToPath(new URL('../', import.meta.url))
function run(args, cwd, expected = 0) {
  return new Promise((resolve, reject) => {
    const child = spawn(args[0], args.slice(1), { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    const timer = setTimeout(() => child.kill('SIGTERM'), 120000)
    child.on('error', reject)
    child.on('exit', code => {
      clearTimeout(timer)
      console.log(output)
      try { assert.equal(code, expected, output); resolve(output) } catch (error) { reject(error) }
    })
  })
}
async function temporary(callback) {
  const dir = await mkdtemp(join(tmpdir(), 'and-scene-test-'))
  try { return await callback(dir) } finally { await rm(dir, { recursive: true, force: true }) }
}
async function copyApp(dir) {
  for (const path of ['src', 'scripts', 'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) await cp(join(root, path), join(dir, path), { recursive: true })
  await symlink(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
}
async function tree(dir) {
  const result = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) result.push(...(await tree(join(dir, entry.name))).map(p => join(entry.name, p)))
    else result.push(entry.name)
  }
  return result.sort()
}
test('INT-001 materialized bootstrap installs builds renders externally and stays byte aligned', { timeout: 180000 }, async () => temporary(async dir => {
  await run([process.execPath, join(root, 'skills/presentation/bootstrap.mjs'), dir], tmpdir())
  const actual = await tree(join(templateRoot, 'src/presentation-kit'))
  assert.deepEqual(actual, await tree(join(root, 'src/presentation-kit')))
  for (const path of actual) assert.equal(await readFile(join(templateRoot, 'src/presentation-kit', path), 'utf8'), await readFile(join(root, 'src/presentation-kit', path), 'utf8'), path)
  for (const path of ['browser.mjs', 'verify.mjs', 'inspect-presentation.mjs', 'diagnostics.mjs']) assert.equal(await readFile(join(templateRoot, 'scripts', path), 'utf8'), await readFile(join(root, 'scripts', path), 'utf8'), path)
  const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
  for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) assert.ok(pkg.dependencies[name], name)
  for (const name of ['vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','typescript-eslint','globals','eslint-plugin-react-hooks','eslint-plugin-react-refresh','playwright']) assert.ok(pkg.devDependencies[name], name)
  assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
  for (const path of actual) assert.ok(!/#[a-fA-F0-9]{3,8}\b|boxShadow:|fontFamily:/.test(await readFile(join(dir, 'src/presentation-kit', path), 'utf8')), path)
  assert.match(await readFile(join(dir, 'src/index.css'), 'utf8'), /^\/\*[^]*\*\/\s*$/)
  await run(['npm','ci','--no-audit','--no-fund'], dir)
  const output = await run(['npm','run','verify','--','example'], dir)
  assert.match(output, /PASS verification: example/)
  assert.match(output, /step 1: rendered/)
  await assert.rejects(materialize(dir), /Refusing to overwrite/)
  await temporary(async partial => {
    const original = { name: 'host', type: 'module', scripts: { build: 'custom-build', unrelated: 'preserve' }, dependencies: { 'host-dependency': '1.0.0' } }
    await writeFile(join(partial, 'package.json'), JSON.stringify(original))
    await writeFile(join(partial, 'host.txt'), 'unchanged')
    await materialize(partial, ['kit'])
    const merged = JSON.parse(await readFile(join(partial, 'package.json'), 'utf8'))
    assert.equal(merged.scripts.build, 'custom-build')
    assert.equal(merged.scripts.unrelated, 'preserve')
    assert.equal(merged.dependencies['host-dependency'], '1.0.0')
    assert.ok(merged.dependencies.motion)
    assert.equal(await readFile(join(partial, 'host.txt'), 'utf8'), 'unchanged')
    assert.ok(await readFile(join(partial, 'scripts/verify.mjs'), 'utf8'))
    await assert.rejects(readFile(join(partial, 'src/main.tsx')), /ENOENT/)
    await assert.rejects(materialize(partial, ['unknown']), /Unknown anchor/)
  })
}))

test('INT-002 inspection captures settled per-step artifacts and advisory diagnostics', { timeout: 180000 }, async () => temporary(async dir => {
  await copyApp(dir)
  await mkdir(join(dir, 'src/presentations/diagnostics'), { recursive: true })
  await writeFile(join(dir, 'src/presentations/diagnostics/Talk.tsx'), `import { Presentation, type Step, type SceneProps } from '../../presentation-kit'
function Diagram({payload}: SceneProps<number>) { return <div>
<span style={{position:'absolute',left:100,top:100}}>unmarked-A-{payload}</span><span style={{position:'absolute',left:100,top:100}}>unmarked-B</span>
<div data-presentation-allow-overlap=""><span style={{position:'absolute',left:300,top:150}}>allowed-A</span><span style={{position:'absolute',left:300,top:150}}>allowed-B</span></div>
</div> }
const steps: Step<number>[] = [0,1,2].map(i => ({id:String(i),era:i===2?'finish':'start',title:'Diagnostic '+i,caption:'Caption '+i,Scene:Diagram,payload:i,groupKey:'diagnostic'}))
export default function Talk() {return <Presentation steps={steps} title="Diagnostic" />}`)
  await writeFile(join(dir, 'src/presentations/index.ts'), `export const presentations = [{slug: 'diagnostics',title:'Diagnostics',load:()=>import('./diagnostics/Talk')}]`)
  const start = Date.now()
  const reports = await inspect({ cwd: dir, slug: 'diagnostics', settleMs: 850 })
  assert.equal(reports.length, 3)
  assert.ok(Date.now() - start >= 3*850)
  for (const [i, report] of reports.entries()) {
    assert.equal(report.index, i)
    assert.equal(report.settledMs, 850)
    if (i) assert.ok(report.capturedAt - reports[i-1].capturedAt >= 850)
    const png = await readFile(join(dir, '.artifacts/inspection/diagnostics', report.filename))
    assert.deepEqual([...png.subarray(0,8)], [137,80,78,71,13,10,26,10])
    assert.ok(png.length > 1000)
    assert.ok(report.warnings.some(w => w.includes(`step ${i}: overlap`) && w.includes('unmarked-A') && w.includes('unmarked-B')))
    assert.ok(!report.warnings.some(w => w.includes('allowed-')))
    assert.ok(report.warnings.some(w => w.includes(`step ${i}: indistinct active progress-entry`)))
    assert.ok(report.warnings.some(w => w.includes(`step ${i}: indistinct active toc-entry`)))
    assert.ok(report.warnings.some(w => w.includes(`step ${i}: unpolished attribution`) && w.includes('[data-presentation-attribution]')))
  }
  assert.equal((await readdir(join(dir, '.artifacts/inspection/diagnostics'))).filter(p => p.endsWith('.png')).length, 3)
  assert.deepEqual(JSON.parse(await readFile(join(dir, '.artifacts/inspection/diagnostics/report.json'), 'utf8')), reports)
}))

// E2E-001 is npm run verify itself; do not duplicate its expensive production build here.
test('E2E-002 independent fault copies fail actionably and clean up preview processes', { timeout: 600000 }, async t => {
  const faults = {
    build: async dir => writeFile(join(dir,'src/broken.ts'), 'const broken: number = "not a number"; export {broken}'),
    missing: async dir => {
      const p=join(dir,'src/presentations/index.ts')
      await writeFile(p, `import type { PresentationEntry } from './registry-type'\nexport const presentations: PresentationEntry[] = []`)
      await writeFile(join(dir,'src/presentations/registry-type.ts'), `import type {ComponentType} from 'react'; export interface PresentationEntry {slug:string;title:string;load:()=>Promise<{default:ComponentType}>}`)
    },
    malformed: async dir => {
      const p=join(dir,'src/presentations/how-to-make-a-presentation/steps/index.ts')
      await writeFile(p, (await readFile(p,'utf8')).replace('step1, step2', 'step2, step1'))
    },
    console: async dir => {
      const p=join(dir,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
      await writeFile(p, (await readFile(p,'utf8')).replace('const node =', `if (beat === 2) console.error('injected console failure');\n  const node =`))
    },
    page: async dir => {
      const p=join(dir,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
      await writeFile(p, `import {useEffect} from 'react'\n` + (await readFile(p,'utf8')).replace('const node =', `useEffect(() => { if(beat === 2) setTimeout(() => { throw new Error('injected page failure') }, 10) }, [beat]);\n  const node =`))
    },
    render: async dir => {
      const p=join(dir,'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
      await writeFile(p, (await readFile(p,'utf8')).replace('const node =', `if(beat === 2) throw new Error('injected render failure');\n  const node =`))
    },
    stalled: async dir => {
      const p=join(dir,'src/presentation-kit/usePresentationNav.ts')
      await writeFile(p, (await readFile(p,'utf8')).replace('value + 1','value'))
    },
  }
  for (const [name, inject] of Object.entries(faults)) await t.test(name, async () => temporary(async dir => {
    await copyApp(dir); await inject(dir)
    const output = await run(['npm','run','verify'], dir, 1)
    assert.ok(!output.includes('PASS verification'))
    if (name === 'build') assert.match(output, /FAIL build/)
    else if (['missing','malformed'].includes(name)) assert.match(output, /FAIL sample/)
    else assert.match(output, /FAIL render step 1/)
    if (['console','page','render'].includes(name)) assert.match(output, new RegExp(`injected ${name} failure`))
    const started = output.match(/preview (http:\/\/127\.0\.0\.1:\d+)/)?.[1]
    if (started) {
      assert.ok(output.includes('preview stopped '+started))
      await assert.rejects(fetch(started))
    }
  }))
})

import { cp, mkdtemp, rm, symlink, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { expect, test } from 'vitest'
const run = promisify(execFile)
async function copyApp(check: (target: string) => Promise<void>) {
  const target = await mkdtemp(join(tmpdir(), 'and-scene-process-'))
  try {
    for (const file of ['src', 'scripts', 'openspec', 'package.json', 'index.html', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts']) await cp(resolve(file), join(target, file), { recursive: true })
    await symlink(resolve('node_modules'), join(target, 'node_modules'), 'dir')
    await check(target)
  } finally { await rm(target, { recursive: true, force: true }) }
}
test.each(['build', 'missing sample', 'console', 'transition'])('verification process fails actionably on %s', async fault => {
  await copyApp(async target => {
    if (fault === 'build') await writeFile(join(target, 'src/broken.ts'), 'const value: string = 42; export { value }')
    if (fault === 'missing sample') await writeFile(join(target, 'src/presentations/index.ts'), "export const presentations: {slug:string; title:string; load:()=>Promise<{default:import('react').ComponentType}>}[] = []")
    if (fault === 'console' || fault === 'transition') {
      const path = join(target, 'index.html')
      const script = fault === 'console' ? 'console.error("injected fault")' : 'window.addEventListener("keydown",e=>e.stopImmediatePropagation(),true)'
      await writeFile(path, (await readFile(path, 'utf8')).replace('</body>', `<script>${script}</script></body>`))
    }
    let output = ''
    try { await run('npm', ['run', 'verify'], { cwd: target }) } catch (error) {
      const failure = error as { stdout: string; stderr: string; code: number }
      expect(failure.code).not.toBe(0)
      output = failure.stdout + failure.stderr
    }
    expect(output).toContain('FAIL verification:')
    expect(output).not.toContain('PASS build, registered reference outline')
    expect(output).toContain(fault === 'build' ? 'build: exited' : fault === 'missing sample' ? 'reference sample must be registered' : fault === 'console' ? 'render step 0:' : 'render step 1:')
  })
}, 30000)
test('inspection writes settled per-step artifacts and diagnoses only unmarked overlap', async () => {
  await copyApp(async target => {
    await writeFile(join(target, 'index.html'), `<!doctype html><html><body>
      <main style="height:400px" data-presentation-root data-step-count="2" data-step-index="0">
      <span style="position:absolute;left:20px;top:20px">collision one</span><span style="position:absolute;left:20px;top:20px">collision two</span>
      <div data-presentation-allow-overlap><span style="position:absolute;top:80px">intentional one</span><span style="position:absolute;top:80px">intentional two</span></div>
      <nav data-presentation-progress><button data-presentation-active="true">First</button><button data-presentation-active="false">Next</button></nav>
      <a href="#" style="font-size:8px" data-presentation-attribution>made by and-scene</a><p id="settled">waiting</p></main>
      <script>setTimeout(()=>document.querySelector('#settled').textContent='settled',600);onkeydown=()=>{document.querySelector('main').dataset.stepIndex='1';document.querySelector('#settled').textContent='waiting';setTimeout(()=>document.querySelector('#settled').textContent='settled',600)}</script></body></html>`)
    const result = await run('node', ['scripts/inspect-presentation.mjs', 'fixture'], { cwd: target })
    expect(result.stdout).toContain('Captured 2 settled steps')
    const diagnostics = JSON.parse(await readFile(join(target, 'inspection/fixture/diagnostics.json'), 'utf8'))
    expect(diagnostics).toHaveLength(2)
    for (const step of diagnostics) {
      expect(step.warnings).toContain('overlap: collision one / collision two')
      expect(step.warnings).toContain('indistinct active progress')
      expect(step.warnings).toContain('unpolished attribution [data-presentation-attribution]')
      expect(step.warnings.join(' ')).not.toContain('intentional')
      expect((await readFile(join(target, step.file))).subarray(1, 4).toString()).toBe('PNG')
    }
  })
}, 30000)

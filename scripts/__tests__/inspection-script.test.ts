import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'

let fixtureRoot = ''
afterEach(async () => { if (fixtureRoot) await rm(fixtureRoot, { recursive: true, force: true }); fixtureRoot = '' })

describe('project inspection browser integration', () => {
  it('captures settled fixture steps and reports defects while exempting marked overlap', async () => {
    fixtureRoot = await mkdtemp(join(tmpdir(), 'and-scene-inspect-'))
    await symlink(join(process.cwd(), 'node_modules'), join(fixtureRoot, 'node_modules'), 'dir')
    await mkdir(join(fixtureRoot, 'dist'), { recursive: true })
    await writeFile(join(fixtureRoot, 'dist/index.html'), `<!doctype html><html><head><style>
      *{box-sizing:border-box}body{margin:0;font:14px Arial}main{position:relative;height:100vh}
      [data-presentation-stage-region]{position:absolute;left:0;top:0;width:220px;height:100px}
      [data-inspect-text]{position:absolute;left:10px;top:10px;width:120px;height:24px}
      [data-inspect-chrome]{position:absolute;left:80px;top:10px;width:100px;height:30px}
      [data-presentation-controls]{position:absolute;left:0;bottom:60px}
      [data-presentation-progress-item]{width:28px;height:20px;border:1px solid gray;color:black;background:white}
      [data-presentation-attribution]{position:absolute;right:10px;bottom:10px;font:8px Times New Roman;color:blue}
    </style></head><body><main data-step-count="2" data-step-index="0">
      <div data-presentation-stage-region><span data-inspect-text>collision marker</span><span data-presentation-allow-overlap style="position:absolute;left:80px;top:12px"><span data-inspect-text>intentional marker</span></span></div>
      <div data-inspect-chrome>chrome region</div>
      <div data-presentation-controls><nav data-presentation-progress><button data-presentation-progress-item data-active="true" aria-current="step">1</button><button data-presentation-progress-item>2</button></nav></div>
      <a data-presentation-attribution href="#">credit</a><button id="next">next</button>
    </main><script>document.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){const root=document.querySelector('main');root.dataset.stepIndex='1';setTimeout(()=>document.querySelector('[data-inspect-text]').textContent='step 2 settled',180)}})</script></body></html>`)
    const result = await new Promise<{ code: number | null; output: string }>((resolveResult, reject) => {
      const child = spawn(process.execPath, [resolve('scripts/inspect-presentation.mjs'), 'fixture'], { cwd: process.cwd(), env: { ...process.env, AND_SCENE_PROJECT_ROOT: fixtureRoot, INSPECT_SETTLE_MS: '260', PORT: '43083' }, stdio: ['ignore', 'pipe', 'pipe'] })
      let output = ''
      child.stdout.on('data', (chunk) => { output += chunk })
      child.stderr.on('data', (chunk) => { output += chunk })
      child.once('error', reject)
      child.once('close', (code) => resolveResult({ code, output }))
    })
    expect(result.code).toBe(0)
    expect(result.output).toContain('Step 1: Visual advisory: Unmarked visible text/chrome overlap')
    expect(result.output).toContain('Step 2: Visual advisory: Unmarked visible text/chrome overlap')
    expect(result.output.toLowerCase()).toContain('active progress indicator')
    expect(result.output).toContain('undersized or browser-default styled')
    expect(result.output).not.toContain('intentional marker')
    const captures = await Promise.all([1, 2].map((step) => readFile(join(fixtureRoot, 'artifacts/inspection/fixture', `step-0${step}.png`))))
    expect(captures.every((image) => image.length > 1000)).toBe(true)
    expect(result.output).toContain('Captured settled step 2/2')
  }, 30000)
})

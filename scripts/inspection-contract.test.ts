// @vitest-environment node
import { cp, mkdtemp, mkdir, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'

const repositoryRoot = process.cwd()
const workspaces: string[] = []

async function createWorkspace() {
  const workspace = await mkdtemp(join(tmpdir(), 'and-scene-inspection-'))
  workspaces.push(workspace)
  await mkdir(join(workspace, 'scripts'), { recursive: true })
  await cp(
    join(repositoryRoot, 'scripts/inspect-presentation.mjs'),
    join(workspace, 'scripts/inspect-presentation.mjs'),
  )
  await symlink(join(repositoryRoot, 'node_modules'), join(workspace, 'node_modules'), 'dir')
  await mkdir(join(workspace, 'dist'), { recursive: true })
  await writeFile(join(workspace, 'dist/index.html'), `<!doctype html>
<html>
  <head>
    <style>
      [data-scene-node] { position: absolute; width: 120px; height: 40px; top: 120px; }
      #unmarked-a, #allowed-a { left: 40px; }
      #unmarked-b, #allowed-b { left: 80px; }
      [data-presentation-progress-item] { color: rgb(1, 1, 1); background-color: rgb(2, 2, 2); font-weight: 400; opacity: 1; border-color: rgb(3, 3, 3); }
    </style>
  </head>
  <body>
    <main data-presentation>
      <div id="chrome" data-step-count="2" data-step-index="0"></div>
      <header data-presentation-header>Header</header>
      <button data-presentation-progress-item aria-current="step">1</button>
      <button data-presentation-progress-item>2</button>
      <div data-presentation-attribution style="font-size: 8px"><a href="#">made by and-scene</a></div>
      <div id="scene"></div>
    </main>
    <script>
      const chrome = document.querySelector('#chrome')
      const scene = document.querySelector('#scene')
      const render = (index) => {
        chrome.dataset.stepIndex = String(index)
        scene.innerHTML = index === 0
          ? '<div id="unmarked-a" data-scene-node="unmarked-a">A</div><div id="unmarked-b" data-scene-node="unmarked-b">B</div>'
          : '<div data-presentation-allow-overlap><div id="allowed-a" data-scene-node="allowed-a">A</div><div id="allowed-b" data-scene-node="allowed-b">B</div></div>'
      }
      render(0)
      window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') render(1)
      })
    </script>
  </body>
</html>
`)
  return workspace
}

function runInspection(workspace: string) {
  return new Promise<{ code: number | null; output: string }>((resolveResult) => {
    const child = spawn(process.execPath, ['scripts/inspect-presentation.mjs', 'fixture'], { cwd: workspace })
    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.once('error', () => resolveResult({ code: null, output }))
    child.once('exit', (code) => resolveResult({ code, output }))
  })
}

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((workspace) => rm(workspace, { recursive: true, force: true })))
})

describe('project-local inspection contract', () => {
  it('captures settled steps and reports warnings while honoring overlap exemptions', async () => {
    const workspace = await createWorkspace()
    const result = await runInspection(workspace)
    const screenshots = await readdir(join(workspace, 'artifacts/presentation-inspection/fixture'))

    expect(result.code).toBe(0)
    expect(result.output).toContain('inspect: advisory step 1: text/chrome overlap: unmarked-a ↔ unmarked-b')
    expect(result.output).toContain('active navigation may be visually indistinct')
    expect(result.output).toContain('attribution is undersized; style [data-presentation-attribution] locally')
    expect(result.output).not.toContain('allowed-a ↔ allowed-b')
    expect(screenshots.sort()).toEqual(['step-01.png', 'step-02.png'])
  })
})

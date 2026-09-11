// @vitest-environment node
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestWorkspace, removeTestWorkspaces, repositoryRoot, runNodeScript } from './test-workspace.ts'

const workspaces: string[] = []

async function createWorkspace() {
  const workspace = await createTestWorkspace(
    'and-scene-inspection-',
    join(repositoryRoot, 'scripts/inspect-presentation.mjs'),
  )
  workspaces.push(workspace)
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

afterEach(async () => {
  await removeTestWorkspaces(workspaces)
})

describe('project-local inspection contract', () => {
  it('captures settled steps and reports warnings while honoring overlap exemptions', async () => {
    const workspace = await createWorkspace()
    const result = await runNodeScript(workspace, 'scripts/inspect-presentation.mjs', ['fixture'])
    const screenshots = await readdir(join(workspace, 'artifacts/presentation-inspection/fixture'))

    expect(result.code).toBe(0)
    expect(result.output).toContain('inspect: advisory step 1: text/chrome overlap: unmarked-a ↔ unmarked-b')
    expect(result.output).toContain('active navigation may be visually indistinct')
    expect(result.output).toContain('attribution is undersized; style [data-presentation-attribution] locally')
    expect(result.output).not.toContain('allowed-a ↔ allowed-b')
    expect(screenshots.sort()).toEqual(['step-01.png', 'step-02.png'])
  })
})

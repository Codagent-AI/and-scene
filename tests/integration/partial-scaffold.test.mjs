// A project that already has a build setup gets only the kit and index, and still builds and renders.
import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, inject, it } from 'vitest'
import { detectAnchors } from '../../skills/presentation/scripts/anchors.mjs'
import { BOOTSTRAP_DIR, createPresentation, scaffoldMissing } from '../../skills/presentation/scripts/scaffold.mjs'
import { linkNodeModules, run, tmpDir } from '../helpers/project.mjs'

describe('partial scaffold on an existing build setup', () => {
  let dir
  let scaffold
  let build
  let verify

  beforeAll(async () => {
    dir = tmpDir('and-scene-partial-')
    for (const file of ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html']) {
      fs.copyFileSync(path.join(BOOTSTRAP_DIR, file), path.join(dir, file))
    }
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({
        name: 'existing',
        private: true,
        type: 'module',
        scripts: { build: 'tsc -b && vite build' },
        dependencies: { react: '^19.2.6' },
        devDependencies: { vite: '^8.0.12', typescript: '~6.0.2' },
      }),
    )
    expect(detectAnchors(dir)).toEqual({ build: true, kit: false, index: false })
    scaffold = scaffoldMissing(dir)
    createPresentation(dir, { slug: 'partial-talk', title: "What's next?" })
    linkNodeModules(path.join(inject('materialized'), 'node_modules'), dir)
    build = await run('npm', ['run', 'build'], { cwd: dir })
    verify = await run('npm', ['run', 'verify', '--', '--skip-build'], { cwd: dir })
  })

  it('adds only the missing anchors plus the dependencies, scripts, and route files they need', () => {
    expect(scaffold.missing).toEqual(['kit', 'index'])
    expect(scaffold.created).toEqual(expect.arrayContaining(['src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts', 'src/Router.tsx', 'scripts/verify.mjs']))
    expect(scaffold.created).not.toContain('package.json')
    expect(scaffold.merged).toEqual(expect.arrayContaining(['dependencies.motion', 'devDependencies.playwright', 'scripts.verify']))
  })

  it('builds cleanly', () => {
    expect(build.code, build.output).toBe(0)
  })

  it('opens the generated route through the verification entry point', () => {
    expect(verify.code, verify.output).toBe(0)
    expect(verify.stdout).toContain('render partial-talk: 3 steps ok')
    expect(verify.stdout).toContain('render hello-scene: 3 steps ok')
  })
})

import { spawn } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export async function createFaultFixture(fault) {
  const directory = await mkdtemp(resolve(tmpdir(), 'and-scene-verify-'))
  await cp(root, directory, {
    recursive: true,
    filter: (source) => !['node_modules', '.git', 'dist', 'artifacts'].some((name) => relative(root, source).split('/').includes(name)),
  })
  await symlink(resolve(root, 'node_modules'), resolve(directory, 'node_modules'), 'dir')
  const registryPath = resolve(directory, 'src/presentations/index.ts')
  const scenePath = resolve(directory, 'src/presentations/how-to-make-a-presentation/steps/HowToScene.tsx')
  const entitiesPath = resolve(directory, 'src/presentations/how-to-make-a-presentation/entities.ts')
  const navigationPath = resolve(directory, 'src/presentation-kit/usePresentationNav.ts')
  if (fault === 'missing-registration') {
    const registry = await readFile(registryPath, 'utf8')
    await writeFile(registryPath, registry.replace(/export const presentations: readonly PresentationRegistration\[\] = \[[\s\S]*?\n\]\n/, 'export const presentations: readonly PresentationRegistration[] = []\n'))
  }
  if (fault === 'runtime-error') {
    const scene = await readFile(scenePath, 'utf8')
    await writeFile(scenePath, scene.replace('  const beat = payload.beat', "  if (payload.beat === 1) console.error('fixture runtime error')\n  const beat = payload.beat"))
  }
  if (fault === 'runtime-reorder') {
    const stepsPath = resolve(directory, 'src/presentations/how-to-make-a-presentation/steps/index.tsx')
    await writeFile(stepsPath, (await readFile(stepsPath, 'utf8')).replace('= outline.map(', '= [...outline].reverse().map('))
  }
  if (fault === 'build-error') await writeFile(entitiesPath, `${await readFile(entitiesPath, 'utf8')}\nconst = fixtureBuildError\n`)
  if (fault === 'stalled-transition') {
    const navigation = await readFile(navigationPath, 'utf8')
    await writeFile(navigationPath, navigation.replace('setIndex((current) => Math.min(lastIndex, current + 1))', 'setIndex((current) => current)'))
  }
  return { directory, cleanup: () => rm(directory, { recursive: true, force: true }) }
}

export function runVerification(fixture) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [resolve(root, 'scripts/verify.mjs')], {
      cwd: fixture.directory,
      env: { ...process.env, AND_SCENE_ROOT: fixture.directory, VERIFY_TRANSITION_TIMEOUT: '500' },
    })
    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.once('error', reject)
    child.once('exit', (code) => resolveRun({ code, output }))
  })
}

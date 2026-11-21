import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readdir, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repository = fileURLToPath(new URL('../../', import.meta.url))

export async function disposableProject(t) {
  const root = await mkdtemp(join(tmpdir(), 'and-scene-test-'))
  t.after(() => rm(root, { force: true, recursive: true }))
  const sourceModules = join(repository, 'node_modules')
  const projectModules = join(root, 'node_modules')
  await mkdir(projectModules)
  const dependencies = (await readdir(sourceModules)).filter((name) => name === '.bin' || !name.startsWith('.'))
  await Promise.all(dependencies.map((name) =>
    symlink(join(sourceModules, name), join(projectModules, name), 'dir')))
  return root
}

export function npmScript(cwd, script, args = []) {
  return new Promise((resolve, reject) => {
    execFile('npm', ['run', script, ...args], { cwd, timeout: 75_000 }, (error, stdout, stderr) => {
      if (error && (error.killed || typeof error.code !== 'number')) {
        reject(new Error(`npm run ${script} could not finish: ${error.message}\n${stdout}\n${stderr}`))
        return
      }
      resolve({ status: error?.code ?? 0, output: `${stdout}\n${stderr}` })
    })
  })
}

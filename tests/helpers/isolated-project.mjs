import { cp, mkdtemp, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const rootFiles = ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']

// Copies the app sources and tooling into a throwaway directory, reusing the repo's node_modules.
export async function isolatedProject(prefix) {
  const temporary = await mkdtemp(path.join(tmpdir(), prefix))
  const project = path.join(temporary, 'app')
  await cp(path.join(repo, 'src'), path.join(project, 'src'), { recursive: true })
  await cp(path.join(repo, 'scripts'), path.join(project, 'scripts'), { recursive: true })
  for (const file of rootFiles) await cp(path.join(repo, file), path.join(project, file))
  await symlink(path.join(repo, 'node_modules'), path.join(project, 'node_modules'), 'dir')
  return { temporary, project }
}

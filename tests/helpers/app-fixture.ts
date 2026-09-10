import { cp, mkdtemp, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const appFiles = [
  'src', 'scripts', 'package.json', 'index.html', 'vite.config.ts',
  'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
]

export async function createAppFixture(prefix: string) {
  const root = process.cwd()
  const directory = await mkdtemp(join(tmpdir(), prefix))
  try {
    for (const file of appFiles) {
      await cp(join(root, file), join(directory, file), { recursive: true })
    }
    await symlink(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir')
    return directory
  } catch (error) {
    await rm(directory, { recursive: true, force: true })
    throw error
  }
}

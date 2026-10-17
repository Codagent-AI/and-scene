import { cp } from 'node:fs/promises'
import path from 'node:path'
import { copyApp, editFile, run } from './helpers.ts'

export const FIXTURES = ['polished', 'collision', 'allowed', 'indistinct', 'unpolished', 'noattr', 'settle', 'morph', 'ungrouped']

/** A throwaway app copy that registers the test-owned fixture presentations next to the sample. */
export async function buildFixtureApp(): Promise<string> {
  const dir = await copyApp()
  const source = path.join(import.meta.dirname, 'fixtures')
  await cp(source, path.join(dir, 'src', 'presentations'), { recursive: true })
  const entries = FIXTURES.map(
    (name) => `  { slug: '${name}', title: 'Fixture ${name}', load: () => import('./${name}/Talk.tsx') },`,
  ).join('\n')
  await editFile(dir, 'src/presentations/index.ts', (text) => text.replace(/\n\]\s*$/, `\n${entries}\n]\n`))
  const build = await run('npm', ['run', 'build'], dir)
  if (build.code !== 0) throw new Error(`fixture app build failed:\n${build.output}`)
  return dir
}

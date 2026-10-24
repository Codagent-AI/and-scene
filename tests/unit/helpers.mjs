import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export function tmpDir(prefix = 'and-scene-unit-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

/** Writes `{ 'rel/path': contents }` under dir; objects are stored as JSON. */
export function write(dir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(dir, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content, null, 2))
  }
  return dir
}

export const buildAnchor = (extra = {}) => ({
  'package.json': {
    scripts: { build: 'tsc -b && vite build' },
    dependencies: { react: '^19' },
    devDependencies: { vite: '^8', typescript: '^6' },
    ...extra,
  },
  'vite.config.ts': '',
  'tsconfig.json': '{}',
})
export const kitAnchor = {
  'src/presentation-kit/types.ts': 'export interface Step { id: string }\nexport interface SceneProps { stepId: string }\n',
  'src/presentation-kit/Presentation.tsx': 'export function Presentation() { return null }\n',
}
export const indexAnchor = {
  'src/presentations/index.ts': "export const presentations = [] as { slug: string; load: () => Promise<unknown> }[]\n  // presentations:end\n",
}

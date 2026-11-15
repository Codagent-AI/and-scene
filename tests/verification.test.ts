// @vitest-environment node
import { it, expect } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { validateReference, browserFault, SAMPLE } from '../scripts/verify.mjs'
it('I-45 reference validator rejects absent malformed unregistered and out-of-order sample', async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'scene-validation-'))
  try {
    await expect(validateReference(cwd)).rejects.toThrow('sample:')
    const directory = path.join(cwd, 'src/presentations', SAMPLE); await mkdir(directory, { recursive: true }); await writeFile(path.join(directory, 'Talk.tsx'), 'export default function Talk() {}'); await writeFile(path.join(directory, 'metadata.json'), '{broken')
    await expect(validateReference(cwd)).rejects.toThrow('sample:')
    const reference = JSON.parse(await readFile('scripts/reference.json', 'utf8')); await writeFile(path.join(directory, 'metadata.json'), JSON.stringify(reference)); await writeFile(path.join(cwd, 'src/presentations/index.ts'), '[]'); await expect(validateReference(cwd)).rejects.toThrow('not registered')
    await writeFile(path.join(cwd, 'src/presentations/index.ts'), `[{ slug: '${SAMPLE}' }]`); await writeFile(path.join(directory, 'metadata.json'), JSON.stringify([...reference].reverse())); await expect(validateReference(cwd)).rejects.toThrow('out of order')
    await writeFile(path.join(directory, 'metadata.json'), JSON.stringify(reference)); expect(await validateReference(cwd)).toEqual(reference)
  } finally { await rm(cwd, { recursive: true, force: true }) }
})
it('I-46 console page and transition error reports retain failing step', () => { for (const kind of ['console', 'pageerror', 'transition']) expect(browserFault(kind, 'fault', 4).message).toBe(`render: step 4: ${kind}: fault`) })

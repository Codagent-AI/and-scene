// Materializes the bootstrap template once, from a working directory outside the repository,
// and installs its dependencies from the template's committed lock data.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { REPO_ROOT, run, tmpDir } from '../helpers/project.mjs'

export default async function setup({ provide }) {
  const dir = tmpDir('and-scene-materialized-')
  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-cwd-'))
  const scaffold = path.join(REPO_ROOT, 'skills/presentation/scripts/scaffold.mjs')
  const result = await run(process.execPath, [scaffold, 'apply', '--target', dir, '--install'], {
    cwd: elsewhere,
    timeoutMs: 280_000,
  })
  if (result.code !== 0) throw new Error(`scaffold apply failed:\n${result.output}`)
  provide('materialized', dir)
  provide('scaffoldOutput', result.stdout)
  return () => {
    fs.rmSync(dir, { recursive: true, force: true })
    fs.rmSync(elsewhere, { recursive: true, force: true })
  }
}

import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestProject } from 'vitest/node'

declare module 'vitest' {
  export interface ProvidedContext {
    templateDir: string
  }
}

/** Materialize the distributable bootstrap template once, outside the repository, and install it from its lock file. */
export default function setup(project: TestProject) {
  const parent = mkdtempSync(join(tmpdir(), 'and-scene-int-'))
  const dir = join(parent, 'app')
  cpSync(join(process.cwd(), 'skills/presentation/templates/bootstrap'), dir, { recursive: true })
  execFileSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'pipe' })
  project.provide('templateDir', dir)
  return () => rmSync(parent, { recursive: true, force: true })
}

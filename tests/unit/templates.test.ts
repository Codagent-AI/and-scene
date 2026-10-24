import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { afterAll, describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../..')
const templateDir = path.join(root, 'skills/presentation/templates/presentation')
const starterDir = path.join(root, 'skills/presentation/templates/bootstrap/src/presentations/getting-started')
const PRESENTATION_FILES = ['entities.ts', 'Scene.tsx', 'steps.ts', 'Talk.tsx', 'talk.css']

const substitute = (text: string, vars: { namespace: string; title: string; slug: string }) =>
  text.replaceAll('__NAMESPACE__', vars.namespace).replaceAll('__TITLE__', vars.title).replaceAll('__SLUG__', vars.slug)

mkdirSync(path.join(root, 'tests/.tmp'), { recursive: true })
const scratch = mkdtempSync(path.join(root, 'tests/.tmp/tpl-'))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

describe('presentation templates', () => {
  it('ship exactly the entities, scene, steps, entry and stylesheet files', () => {
    expect(readdirSync(templateDir).sort()).toEqual([...PRESENTATION_FILES].sort())
  })

  it('the bootstrap starter is the template with its placeholders filled in', () => {
    for (const file of PRESENTATION_FILES) {
      const expected = substitute(readFileSync(path.join(templateDir, file), 'utf8'), { namespace: 'starter', title: 'Getting Started', slug: 'getting-started' })
      expect(readFileSync(path.join(starterDir, file), 'utf8'), file).toBe(expected)
    }
  })

  it('a presentation made from the template under a new name typechecks against the unchanged kit', () => {
    const dir = path.join(scratch, 'src/presentations/fresh-name')
    mkdirSync(dir, { recursive: true })
    cpSync(path.join(root, 'src/presentation-kit'), path.join(scratch, 'src/presentation-kit'), { recursive: true })
    for (const file of PRESENTATION_FILES) {
      const text = substitute(readFileSync(path.join(templateDir, file), 'utf8'), { namespace: 'fresh', title: 'Fresh Title', slug: 'fresh-name' })
      writeFileSync(path.join(dir, file), text)
    }
    writeFileSync(path.join(scratch, 'src/vite-env.d.ts'), '/// <reference types="vite/client" />\n')
    const config = ts.getParsedCommandLineOfConfigFile(path.join(root, 'tsconfig.app.json'), { noEmit: true, tsBuildInfoFile: undefined, incremental: false }, {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (d) => {
        throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'))
      },
    })!
    const program = ts.createProgram({
      rootNames: [...PRESENTATION_FILES.filter((f) => /\.tsx?$/.test(f)).map((f) => path.join(dir, f)), path.join(scratch, 'src/vite-env.d.ts')],
      options: { ...config.options, composite: false, incremental: false, configFilePath: undefined, noEmit: true },
    })
    const diagnostics = ts.getPreEmitDiagnostics(program).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
    expect(diagnostics).toEqual([])
    const entities = readFileSync(path.join(dir, 'entities.ts'), 'utf8')
    expect(entities).toContain('fresh/')
    expect(entities).not.toContain('starter')
    expect(readFileSync(path.join(dir, 'steps.ts'), 'utf8')).not.toMatch(/__[A-Z]+__/)
  }, 90000) // a cold TypeScript program over the kit and its dependencies can take tens of seconds
})

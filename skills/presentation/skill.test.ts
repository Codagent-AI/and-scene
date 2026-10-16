import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const md = readFileSync(path.resolve(__dirname, 'SKILL.md'), 'utf8')

describe('SKILL.md contract', () => {
  it('has skill frontmatter', () => {
    expect(md).toMatch(/^---\nname: presentation\ndescription: .+\n---/)
  })

  it.each([
    ['one question at a time', /one question (per message|at a time)/i],
    ['partial detail opt-in', /partial detail/i],
    ['optional ASCII mockups', /ASCII mockup/],
    ['three contract anchors', /Build setup[\s\S]*Scene kit[\s\S]*Presentation index/],
    ['monorepo presentations/ target', /Monorepo[\s\S]*presentations\//],
    ['confirm target before writing', /state the target[\s\S]*confirm/i],
    ['templates resolved from the skill directory', /relative to \*\*this SKILL\.md's directory\*\*/],
    ['list candidates when modify is ambiguous', /list the registered presentations/i],
    ['scoped modification', /only about\s+the requested changes/i],
    ['presentation-owned plain CSS', /talk\.css[\s\S]*plain CSS/],
    ['build, verify and project-local inspect', /npm run build[\s\S]*npm run verify[\s\S]*npm run inspect/],
    ['narrow viewport check', /--viewport 390x844/],
    ['never report success while failing', /Never report success while a check fails/],
    ['marks only intentional overlap', /data-presentation-allow-overlap/],
    ['no styling framework by default', /styling-framework-neutral/],
  ])('states: %s', (_name, re) => {
    expect(md).toMatch(re)
  })
})

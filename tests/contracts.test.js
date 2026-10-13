import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFile(resolve(root, path), 'utf8')

describe('presentation contracts', () => {
  it('keeps the reference sample registered with all canonical beats', async () => {
    const registry = await read('src/presentations/index.ts')
    const steps = await read('src/presentations/how-to-make-a-presentation/steps/index.ts')
    expect(registry).toContain("slug: 'how-to-make-a-presentation'")
    expect(steps.match(/\['(?:the ask|the gathering|the build|the loop|the reveal)'/g)).toHaveLength(9)
    for (const title of ['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"]) expect(steps).toContain(title)
  })

  it('ships a style-neutral kit identical to the bootstrap snapshot', async () => {
    const { readdir, stat } = await import('node:fs/promises')
    const visit = async (path) => {
      const names = await readdir(resolve(root, path))
      return (await Promise.all(names.map(async (name) => {
        const child = `${path}/${name}`
        if ((await stat(resolve(root, child))).isDirectory()) return visit(child)
        return [child.replace(/^(?:src|skills\/presentation\/templates\/bootstrap\/src)\/presentation-kit\//, ''), await read(child)]
      }))).flat()
    }
    const canonical = await visit('src/presentation-kit')
    const template = await visit('skills/presentation/templates/bootstrap/src/presentation-kit')
    expect(template).toEqual(canonical)
    expect(canonical.some(([, contents]) => /#[0-9a-f]{3,8}\b|font-family|box-shadow|tailwind/i.test(contents))).toBe(false)
  })

  it('keeps bootstrap verification and inspection scripts aligned with the app', async () => {
    expect(await read('skills/presentation/templates/bootstrap/scripts/verify.mjs')).toBe(await read('scripts/verify.mjs'))
    expect(await read('skills/presentation/templates/bootstrap/scripts/inspect-presentation.mjs')).toBe(await read('scripts/inspect-presentation.mjs'))
  })
})

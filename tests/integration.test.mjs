import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  mkdtemp,
  cp,
  mkdir,
  readFile,
  writeFile,
  rm,
  readdir,
  symlink,
  stat,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { withPreview, expectIndex } from '../scripts/browser.mjs'
import {
  scaffold,
  bootstrapDirectory,
} from '../skills/presentation/scaffold.mjs'

const repository = resolve('.')
async function run(args, cwd, timeout = 120000) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(args[0], args.slice(1), {
      cwd,
      env: { ...process.env, NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout.on('data', (data) => {
      output += data
    })
    child.stderr.on('data', (data) => {
      output += data
    })
    const timer = setTimeout(() => child.kill('SIGKILL'), timeout)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolveRun({ code, output })
    })
  })
}
async function temporary(callback) {
  const directory = await mkdtemp(join(tmpdir(), 'and-scene-'))
  try {
    return await callback(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
async function sourceCopy(directory) {
  for (const path of [
    'src',
    'public',
    'scripts',
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'package.json',
    'package-lock.json',
  ])
    await cp(join(repository, path), join(directory, path), { recursive: true })
  await symlink(
    join(repository, 'node_modules'),
    join(directory, 'node_modules'),
    'dir',
  )
}
async function files(directory) {
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory())
      result.push(
        ...(await files(join(directory, entry.name))).map(
          (name) => `${entry.name}/${name}`,
        ),
      )
    else result.push(entry.name)
  }
  return result.sort()
}
function assertCleaned(output) {
  const previews = [
    ...output.matchAll(/preview http:\/\/127\.0\.0\.1:\d+ pid=(\d+)/g),
  ].map((match) => Number(match[1]))
  const browsers = [...output.matchAll(/browser started pid=(\d+)/g)].map(
    (match) => Number(match[1]),
  )
  assert.equal(
    browsers.length,
    previews.length,
    'every ready preview launches an observed Chromium process',
  )
  for (const [kind, pids] of [
    ['preview', previews],
    ['browser', browsers],
  ]) {
    for (const pid of pids) {
      assert.match(output, new RegExp(`${kind} cleaned pid=${pid}`))
      assert.throws(
        () => process.kill(pid, 0),
        { code: 'ESRCH' },
        `${kind} process ${pid} must have terminated`,
      )
      console.log(`cleanup verified: ${kind} pid=${pid} exited`)
    }
  }
}

async function redMarkerBounds(page, png) {
  return page.evaluate(async (encoded) => {
    const bytes = Uint8Array.from(atob(encoded), (character) =>
      character.charCodeAt(0),
    )
    const bitmap = await createImageBitmap(
      new Blob([bytes], { type: 'image/png' }),
    )
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const context = canvas.getContext('2d')
    context.drawImage(bitmap, 0, 0)
    const image = context.getImageData(0, 0, bitmap.width, bitmap.height)
    const bounds = {
      left: bitmap.width,
      right: -1,
      top: bitmap.height,
      bottom: -1,
      count: 0,
    }
    for (let y = 0; y < bitmap.height; y++) {
      for (let x = 0; x < bitmap.width; x++) {
        const index = (y * bitmap.width + x) * 4
        if (
          image.data[index] === 255 &&
          image.data[index + 1] === 0 &&
          image.data[index + 2] === 0 &&
          image.data[index + 3] === 255
        ) {
          bounds.left = Math.min(bounds.left, x)
          bounds.right = Math.max(bounds.right, x)
          bounds.top = Math.min(bounds.top, y)
          bounds.bottom = Math.max(bounds.bottom, y)
          bounds.count++
        }
      }
    }
    bitmap.close()
    return bounds
  }, png.toString('base64'))
}

test(
  'INT-001 materialized bootstrap is complete, style-neutral and aligned',
  { timeout: 180000 },
  async () => {
    const canonicalFiles = await files(join(repository, 'src/presentation-kit'))
    for (const file of canonicalFiles)
      assert.equal(
        await readFile(
          join(bootstrapDirectory, 'src/presentation-kit', file),
          'utf8',
        ),
        await readFile(join(repository, 'src/presentation-kit', file), 'utf8'),
        file,
      )
    for (const file of await files(join(repository, 'scripts')))
      assert.equal(
        await readFile(join(bootstrapDirectory, 'scripts', file), 'utf8'),
        await readFile(join(repository, 'scripts', file), 'utf8'),
        file,
      )
    await temporary(async (outer) => {
      const target = join(outer, 'app')
      const copy = await run(
        [
          process.execPath,
          join(repository, 'skills/presentation/scaffold.mjs'),
          target,
        ],
        outer,
      )
      assert.equal(copy.code, 0, copy.output)
      const pkg = JSON.parse(await readFile(join(target, 'package.json')))
      for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react'])
        assert.ok(pkg.dependencies[dependency], dependency)
      for (const dependency of [
        'vite',
        '@vitejs/plugin-react',
        'typescript',
        '@types/react',
        '@types/react-dom',
        '@types/node',
        'eslint',
        '@eslint/js',
        'typescript-eslint',
        'eslint-plugin-react-hooks',
        'eslint-plugin-react-refresh',
        'globals',
        'playwright',
      ])
        assert.ok(pkg.devDependencies[dependency], dependency)
      assert.ok(
        !Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some(
          (name) => name.includes('tailwind'),
        ),
      )
      const kitSources = (
        await Promise.all(
          canonicalFiles.map((file) =>
            readFile(join(target, 'src/presentation-kit', file), 'utf8'),
          ),
        )
      ).join('\n')
      assert.doesNotMatch(
        kitSources,
        /fontFamily:|background:|boxShadow:|borderColor:|#[0-9a-f]{3,8}\b/i,
      )
      for (const anchor of [
        'vite.config.ts',
        'src/presentation-kit/Presentation.tsx',
        'src/presentations/index.ts',
      ])
        assert.ok(await stat(join(target, anchor)))
      const install = await run(
        ['npm', 'ci', '--no-audit', '--no-fund'],
        target,
      )
      assert.equal(install.code, 0, install.output)
      const verify = await run(['npm', 'run', 'verify'], target)
      assert.equal(verify.code, 0, verify.output)
      assert.match(verify.output, /PASS build \+ starter all steps/)
      assertCleaned(verify.output)
      // Re-running complete infrastructure must preserve every file.
      const original = await readFile(
        join(target, 'src/presentation-kit/Presentation.tsx'),
        'utf8',
      )
      assert.deepEqual((await scaffold(target)).missing, [])
      assert.equal(
        await readFile(
          join(target, 'src/presentation-kit/Presentation.tsx'),
          'utf8',
        ),
        original,
      )
      const partial = join(outer, 'partial')
      await mkdir(partial)
      await writeFile(
        join(partial, 'package.json'),
        JSON.stringify({
          scripts: { build: 'existing-build' },
          dependencies: { react: pkg.dependencies.react },
        }),
      )
      await writeFile(join(partial, 'vite.config.ts'), '// existing config')
      const before = await readFile(join(partial, 'package.json'), 'utf8')
      await assert.rejects(
        scaffold(partial),
        /Confirm the stated scaffold target/,
      )
      assert.equal(
        await readFile(join(partial, 'package.json'), 'utf8'),
        before,
      )
      const result = await scaffold(partial, {
        confirmed: true,
        anchors: { build: true, kit: false, index: false },
      })
      assert.deepEqual(result.missing, ['kit', 'index'])
      assert.equal(
        await readFile(join(partial, 'vite.config.ts'), 'utf8'),
        '// existing config',
      )
      assert.equal(
        JSON.parse(await readFile(join(partial, 'package.json'))).scripts.build,
        'existing-build',
      )
      const mono = join(outer, 'mono')
      await mkdir(mono)
      const monoPackage =
        '{"workspaces":["apps/*"],"scripts":{"build":"root-build"}}'
      await writeFile(join(mono, 'package.json'), monoPackage)
      await writeFile(join(mono, 'unrelated.txt'), 'preserve')
      assert.equal(
        (await scaffold(mono, { confirmed: true })).target,
        join(mono, 'presentations'),
      )
      assert.equal(
        await readFile(join(mono, 'package.json'), 'utf8'),
        monoPackage,
      )
      assert.equal(
        await readFile(join(mono, 'unrelated.txt'), 'utf8'),
        'preserve',
      )
    })
  },
)

test(
  'INT-002 helper captures settled artifacts and advisory diagnostics',
  { timeout: 120000 },
  async () => {
    await temporary(async (directory) => {
      await sourceCopy(directory)
      const scene = `import { useEffect, useState } from 'react'
import { Presentation } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
function Scene({ payload }: SceneProps<number>) {
 const [settled, setSettled] = useState(false)
 useEffect(() => { setSettled(false); const timer = setTimeout(() => setSettled(true), 300); return () => clearTimeout(timer) }, [payload])
 return <div>
   <span data-animated="" style={{position:'absolute',left:10,top:50,width:20,height:20,background:'#ff0000',transform:'translateX('+((settled ? payload+1 : payload)*90)+'px)',transition:'transform .4s linear'}} />
   <span style={{position:'absolute',left:100,top:120}}>{settled ? 'collision A settled' : 'moving A'}</span><span style={{position:'absolute',left:100,top:120}}>collision B</span>
   <div data-presentation-allow-overlap="true"><span style={{position:'absolute',left:100,top:180}}>allowed A</span><span style={{position:'absolute',left:100,top:180}}>allowed B</span></div>
   <span style={{position:'absolute',left:20,top:230}}>state {payload}</span>
 </div>
}
const steps: Step<number>[] = [0,1,2].map(i=>({id:'id-'+i,era:'era-'+i,title:'Step '+i,caption:'Caption '+i,groupKey:'fixture',Scene,payload:i}))
export default function Talk(){ return <Presentation steps={steps} title="Fixture" /> }
`
      const folder = join(directory, 'src/presentations/diagnostic-fixture')
      await mkdir(folder)
      await writeFile(join(folder, 'Talk.tsx'), scene)
      await writeFile(
        join(directory, 'src/presentations/index.ts'),
        `export const presentations = [{slug:'diagnostic-fixture',title:'Fixture',load:()=>import('./diagnostic-fixture/Talk')}]\nexport interface PresentationEntry {slug:string;title:string;load:()=>Promise<{default: import('react').ComponentType}>}\n`,
      )
      // Keep host CSS from affecting fixture diagnostics.
      await writeFile(join(directory, 'src/index.css'), 'body { margin:0 }')
      const result = await run(
        ['npm', 'run', 'inspect', '--', 'diagnostic-fixture'],
        directory,
      )
      assert.equal(result.code, 0, result.output)
      assert.match(
        result.output,
        /ADVISORY step 0: overlap .*collision A settled.*collision B/,
      )
      assert.match(result.output, /indistinct active progress/)
      assert.match(result.output, /indistinct active toc/)
      assert.match(result.output, /style \[data-presentation-attribution\]/)
      assert.doesNotMatch(result.output, /overlap .*allowed [AB]/)
      const artifacts = join(
        directory,
        'artifacts/inspection/diagnostic-fixture',
      )
      const report = JSON.parse(await readFile(join(artifacts, 'report.json')))
      assert.equal(report.length, 3)
      const decoder = await chromium.launch({ headless: true })
      try {
        const page = await decoder.newPage()
        for (let i = 0; i < 3; i++) {
          assert.equal(report[i].file, `step-0${i + 1}.png`)
          assert.ok(report[i].elapsedBeforeCapture >= report[i].settle)
          assert.ok(report[i].elapsed >= report[i].elapsedBeforeCapture)
          const png = await readFile(join(artifacts, report[i].file))
          assert.equal(png.readUInt32BE(16), 1440)
          assert.equal(png.readUInt32BE(20), 900)
          // The canvas is centered in the stage beside the 180px wide ToC.
          const canvasLeft = 180 + (1440 - 180 - 880) / 2
          const targetLeft = canvasLeft + 10 + (i + 1) * 90
          const bounds = await redMarkerBounds(page, png)
          assert.equal(
            bounds.left,
            targetLeft,
            `step ${i} marker starts at its final position`,
          )
          assert.equal(
            bounds.right,
            targetLeft + 19,
            `step ${i} marker ends at its final position`,
          )
          assert.ok(
            bounds.count >= 380 && bounds.count <= 400,
            `step ${i} contains the solid 20px marker`,
          )
          assert.ok(
            bounds.left > targetLeft - 90 + 19,
            `step ${i} clears the preceding marker position`,
          )
          assert.ok(
            report[i].warnings.some((warning) =>
              warning.includes('collision A settled'),
            ),
            `step ${i} diagnostics observe its settled text`,
          )
          assert.ok(
            !report[i].warnings.some((warning) => warning.includes('moving A')),
            `step ${i} diagnostics omit its moving text`,
          )
          console.log(
            `settled PNG step ${i}: red bounds=${JSON.stringify(bounds)}, expectedLeft=${targetLeft}, waitBeforeCapture=${report[i].elapsedBeforeCapture}ms`,
          )
          assert.ok(
            report[i].warnings.every((warning) =>
              warning.startsWith(`step ${i}:`),
            ),
          )
        }
      } finally {
        await decoder.close()
      }
      assertCleaned(result.output)
    })
  },
)

test(
  'E2E-001 canonical reference passes whole-app production verification',
  { timeout: 120000 },
  async () => {
    const result = await run(['npm', 'run', 'verify'], repository)
    assert.equal(result.code, 0, result.output)
    assert.match(result.output, /tsc -b && vite build/)
    assert.match(
      result.output,
      /PASS build \+ how-to-make-a-presentation all steps/,
    )
    assert.deepEqual(
      [...result.output.matchAll(/render step (\d+) PASS/g)].map((match) =>
        Number(match[1]),
      ),
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
    )
    assert.match(result.output, /http:\/\/127\.0\.0\.1:/)
    assert.doesNotMatch(result.output, /localhost/)
    assertCleaned(result.output)
    await withPreview(repository, async (browser, url) => {
      const page = await browser.newPage()
      await page.goto(`${url}/how-to-make-a-presentation`)
      await expectIndex(page, 0)
      for (let index = 1; index <= 6; index++) {
        await page.keyboard.press('ArrowRight')
        await expectIndex(page, index)
      }
      await page.waitForFunction(() => {
        const check = document.querySelector('[data-check-state]')
        const wrapper = check?.closest('[data-presentation-appear]')
        return wrapper && getComputedStyle(wrapper).opacity === '1'
      })
      const visibleAt = Date.now()
      assert.equal(
        await page
          .locator('[data-check-state]')
          .getAttribute('data-check-state'),
        'checking',
        'checking remains visible after entry completes',
      )
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-check-state]')
            ?.getAttribute('data-check-state') === 'passed',
      )
      const observation = await page
        .locator('[data-check-state]')
        .evaluate((check) => ({
          opacity: getComputedStyle(check.closest('[data-presentation-appear]'))
            .opacity,
          color: getComputedStyle(check).color,
          text: check.parentElement.textContent,
        }))
      assert.equal(observation.opacity, '1', 'passed checks are visible')
      assert.match(observation.text, /build ✓render ✓/)
      const [red, green, blue] = observation.color.match(/\d+/g).map(Number)
      assert.ok(
        green > red && green > blue,
        'passed checks have a green treatment',
      )
      const visibleCheckingMs = Date.now() - visibleAt
      assert.ok(
        visibleCheckingMs >= 200,
        `checking is observable for ${visibleCheckingMs}ms after full entry`,
      )
      console.log(
        `I-31 visible check sequence: checking opacity=1, passed opacity=${observation.opacity}, visibleCheckingMs=${visibleCheckingMs}, color=${observation.color}`,
      )
    })
  },
)

test(
  'E2E-002 faults fail with phase, step and process cleanup',
  { timeout: 300000 },
  async () => {
    const cases = [
      [
        'build',
        async (directory) => {
          await writeFile(
            join(directory, 'src/broken.ts'),
            'export const broken: number = "wrong"',
          )
        },
        /FAIL build/,
      ],
      [
        'missing',
        async (directory) => {
          await writeFile(
            join(directory, 'src/presentations/index.ts'),
            `import type { ComponentType } from 'react'\nexport interface PresentationEntry {slug:string;title:string;load:()=>Promise<{default:ComponentType}>}\nexport const presentations: PresentationEntry[]=[]`,
          )
        },
        /FAIL sample/,
      ],
      [
        'order',
        async (directory) => {
          const path = join(
            directory,
            'src/presentations/how-to-make-a-presentation/outline.json',
          )
          const outline = JSON.parse(await readFile(path))
          ;[outline[0], outline[1]] = [outline[1], outline[0]]
          await writeFile(path, JSON.stringify(outline))
        },
        /FAIL sample.*outline mismatch at step 0/,
      ],
      [
        'console',
        async (directory) => {
          const path = join(
            directory,
            'src/presentations/how-to-make-a-presentation/steps/Scene.tsx',
          )
          await writeFile(
            path,
            (await readFile(path, 'utf8')).replace(
              'export function ReferenceScene({ payload: beat }: SceneProps<number>) {',
              "export function ReferenceScene({ payload: beat }: SceneProps<number>) {\n  useEffect(() => { if (beat === 3) console.error('injected console fault') }, [beat])",
            ),
          )
        },
        /FAIL render step 2:.*injected console fault/,
      ],
      [
        'page',
        async (directory) => {
          const path = join(
            directory,
            'src/presentations/how-to-make-a-presentation/steps/Scene.tsx',
          )
          await writeFile(
            path,
            (await readFile(path, 'utf8')).replace(
              'export function ReferenceScene({ payload: beat }: SceneProps<number>) {',
              "export function ReferenceScene({ payload: beat }: SceneProps<number>) {\n  useEffect(() => { if (beat === 3) setTimeout(() => { throw new Error('injected page fault') }, 20) }, [beat])",
            ),
          )
        },
        /FAIL render step 2:.*injected page fault/,
      ],
      [
        'render',
        async (directory) => {
          const path = join(
            directory,
            'src/presentations/how-to-make-a-presentation/steps/Scene.tsx',
          )
          await writeFile(
            path,
            (await readFile(path, 'utf8')).replace(
              'export function ReferenceScene({ payload: beat }: SceneProps<number>) {',
              "export function ReferenceScene({ payload: beat }: SceneProps<number>) {\n  if (beat === 3) throw new Error('injected render fault')",
            ),
          )
        },
        /FAIL render step 2:.*injected render fault/,
      ],
      [
        'transition',
        async (directory) => {
          const path = join(
            directory,
            'src/presentation-kit/usePresentationNav.ts',
          )
          await writeFile(
            path,
            (await readFile(path, 'utf8')).replace(
              'clampStep(i + 1, count)',
              'clampStep(i, count)',
            ),
          )
        },
        /FAIL render step 1:.*transition failed at step 1/,
      ],
    ]
    for (const [name, inject, expected] of cases) {
      await temporary(async (directory) => {
        await sourceCopy(directory)
        await inject(directory)
        const result = await run(['npm', 'run', 'verify'], directory)
        assert.notEqual(result.code, 0, `${name}: ${result.output}`)
        assert.match(result.output, expected, name)
        assert.doesNotMatch(result.output, /PASS build \+/)
        assertCleaned(result.output)
        console.log(`${name}: ${result.output.match(/FAIL [^\n]+/)?.[0]}`)
      })
    }
  },
)

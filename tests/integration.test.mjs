import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  cp,
  readFile,
  writeFile,
  rm,
  readdir,
  mkdir,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";
import { scaffold, templateRoot } from "../scripts/scaffold.mjs";
const source = resolve(".");
// Disposable work remains in the repository; installations and builds are shared per fixture.
const work = resolve(".work/integration");
await mkdir(work, { recursive: true });
async function exec(args, cwd) {
  return await new Promise((resolve, reject) => {
    const child = spawn(args[0], args.slice(1), { cwd, env: process.env });
    let log = "";
    child.stdout.on("data", (d) => (log += d));
    child.stderr.on("data", (d) => (log += d));
    child.on("error", reject);
    child.on("exit", (code) => resolve({ code, log }));
  });
}
async function run(args, cwd) {
  const r = await exec(args, cwd);
  console.log(r.log);
  assert.equal(r.code, 0, r.log);
  return r.log;
}
async function disposable(name, fn) {
  const dir = await mkdtemp(join(work, name));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
async function copyApp(dir) {
  for (const p of [
    "src",
    "scripts",
    "package.json",
    "package-lock.json",
    "index.html",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "vite.config.ts",
  ])
    await cp(join(source, p), join(dir, p), { recursive: true });
  // Share the installed locked dependency cache; keep generated TS state per fixture.
  await symlink(join(source,"node_modules"),join(dir,"node_modules"),"dir");
  for(const config of ["tsconfig.app.json","tsconfig.node.json"]) {
    const path=join(dir,config);
    await writeFile(path,(await readFile(path,"utf8")).replaceAll("./node_modules/.tmp/","./.cache/"));
  }
}
async function parity(a, b) {
  for (const ent of await readdir(a, { withFileTypes: true })) {
    const x = join(a, ent.name),
      y = join(b, ent.name);
    if (ent.isDirectory()) await parity(x, y);
    else assert.equal(await readFile(x, "utf8"), await readFile(y, "utf8"), x);
  }
}
test(
  "INT-001 materialized bootstrap builds and verifies outside source cwd with aligned neutral kit",
  { timeout: 180000 },
  async () => {
    await disposable("bootstrap-", async (dir) => {
      const before = process.cwd();
      process.chdir(tmpdir());
      try {
        const result = await scaffold(dir);
        assert.equal(result.target, dir);
        assert.ok(result.written.length);
      } finally {
        process.chdir(before);
      }
      await run(
        ["npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund"],
        dir,
      );
      const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
      for (const dep of [
        "react",
        "react-dom",
        "motion",
        "lucide-react",
        "vite",
        "@vitejs/plugin-react",
        "typescript",
        "@types/react",
        "@types/react-dom",
        "@types/node",
        "eslint",
        "@eslint/js",
        "typescript-eslint",
        "eslint-plugin-react-hooks",
        "eslint-plugin-react-refresh",
        "globals",
        "playwright",
      ])
        assert.ok(pkg.dependencies?.[dep] || pkg.devDependencies?.[dep], dep);
      assert.ok(!JSON.stringify(pkg).toLowerCase().includes("tailwind"));
      await parity(
        join(source, "src/presentation-kit"),
        join(dir, "src/presentation-kit"),
      );
      for (const script of [
        "browser.mjs",
        "diagnostics.mjs",
        "inspect-presentation.mjs",
        "verify.mjs",
        "registry.mjs",
      ])
        assert.equal(
          await readFile(join(source, "scripts", script), "utf8"),
          await readFile(join(dir, "scripts", script), "utf8"),
        );
      // Materialize the public presentation code templates in the same fresh app.
      async function materializeTemplates(folder, destination) {
        await mkdir(destination,{recursive:true});
        for(const entry of await readdir(folder,{withFileTypes:true})) {
          const from=join(folder,entry.name),to=join(destination,entry.name.replace(/\.template$/,''));
          if(entry.isDirectory()) await materializeTemplates(from,to);
          else {
            let text=await readFile(from,'utf8');
            for(const [key,value] of Object.entries({title:'Template example',caption:'A generated template step.',topic:'Template topic',slug:'template-example'})) text=text.replaceAll(`{{${key}}}`,value);
            await writeFile(to,text);
          }
        }
      }
      await materializeTemplates(resolve(templateRoot,'..','presentation'),join(dir,'src/presentations/template-example'));
      const registry=join(dir,'src/presentations/index.ts');
      await writeFile(registry,(await readFile(registry,'utf8')).replace('export const presentations = [',"export const presentations = [{slug:'template-example',title:'Template example',load:()=>import('./template-example/Talk')},"));
      const log = await run(["npm", "run", "verify"], dir);
      assert.match(log, /step 0 rendered/);
      assert.match(log, /PASS/);
      const generated=await run(['node','scripts/verify.mjs','--slug=template-example','--first-only'],dir);
      assert.match(generated,/step 0 rendered/);assert.match(generated,/PASS/);
    });
  },
);
test(
  "INT-002 settled per-step artifacts and advisory overlap active attribution diagnostics",
  { timeout: 180000 },
  async () => {
    await disposable("inspection-", async (dir) => {
      await copyApp(dir);
      const fixture = `import {useState,useEffect} from 'react';
import {Presentation} from '../../presentation-kit/Presentation';
import type {SceneProps,Step} from '../../presentation-kit/types';
function Scene({payload}:SceneProps<number>){const [settled,setSettled]=useState(false);useEffect(()=>{const t=setTimeout(()=>setSettled(true),500);return ()=>clearTimeout(t)},[payload]);return <div data-presentation-allow-overlap={payload===1?'':undefined}>{settled&&<><span id="collision-a" style={{position:'absolute',left:100,top:140}}>Collision text</span><span id="collision-b" style={{position:'absolute',left:100,top:140}}>Collision text</span><svg style={{position:'absolute',left:300,top:140,width:200,height:60}}><text id="svg-a" x="0" y="20">SVG collision</text><text id="svg-b" x="0" y="20">SVG collision</text></svg></>}</div>}
const steps:Step<number>[]=[0,1,2,3,4].map(i=>({id:String(i),era:'era'+i,title:'Fixture '+i,caption:'Fixture caption',Scene,payload:i}));
export default function Talk(){return <><style>{'a{color:#254b30;text-decoration:none} [data-presentation-attribution]{font-size:8px} [data-step-index="2"] [data-presentation-attribution]{display:none} [data-step-index="3"] [data-presentation-attribution]{font-size:12px} [data-step-index="4"] [data-presentation-attribution]{all:revert}'}</style><Presentation steps={steps} title="Fixture"/></>}`;
      await mkdir(join(dir, "src/presentations/fixture"), { recursive: true });
      await writeFile(join(dir, "src/presentations/fixture/Talk.tsx"), fixture);
      const registry = join(dir, "src/presentations/index.ts");
      await writeFile(
        registry,
        (await readFile(registry, "utf8")).replace(
          "export const presentations = [",
          "export const presentations = [{slug:'fixture',title:'Fixture',load:()=>import('./fixture/Talk')},",
        ),
      );
      const start = Date.now();
      const log = await run(["npm", "run", "inspect", "--", "fixture"], dir);
      assert.ok(Date.now() - start >= 2400);
      const out = join(dir, "artifacts/inspection/fixture/1440x1000");
      const report = JSON.parse(
        await readFile(join(out, "report.json"), "utf8"),
      );
      assert.equal(report.length, 5);
      for (const [i, row] of report.entries()) {
        assert.equal(row.file, `step-0${i + 1}.png`);
        const png = await readFile(join(out, row.file));
        assert.ok(png.length > 100);
        assert.equal(row.settle, 800);
        assert.ok(row.warnings.some((w) => w.kind === "active"));
        assert.equal(row.warnings.some((w) => w.kind === "attribution"),i!==3);
      }
      assert.ok(
        report[0].warnings.some(
          (w) =>
            w.kind === "overlap" &&
            w.detail.includes("collision-a") &&
            w.detail.includes("collision-b"),
        ),
      );
      assert.ok(
        !report[1].warnings.some(
          (w) => w.kind === "overlap" && w.detail.includes("collision-"),
        ),
      );
      assert.ok(
        report[2].warnings.some(
          (w) => w.kind === "attribution" && w.detail.includes("missing"),
        ),
      );
      assert.ok(report[0].warnings.some(w=>w.kind==='overlap'&&w.detail.includes('svg-a')&&w.detail.includes('svg-b')));
      assert.ok(!report[1].warnings.some(w=>w.kind==='overlap'&&w.detail.includes('svg-')));
      assert.ok(report[4].warnings.some(w=>w.kind==='attribution'&&w.detail.endsWith('browser-default')));
      assert.ok(report[0].warnings.some(w=>w.kind==='attribution'&&w.detail.endsWith('too small')));
      const wide=await readFile(join(out,'step-01.png'));
      assert.equal(wide.readUInt32BE(16),1440);assert.equal(wide.readUInt32BE(20),1000);
      await run(['npm','run','inspect','--','fixture','--viewport=390x844','--no-build'],dir);
      const narrowDir=join(dir,'artifacts/inspection/fixture/390x844');
      const narrow=JSON.parse(await readFile(join(narrowDir,'report.json'),'utf8'));
      assert.equal(narrow.length,5);assert.deepEqual(narrow[0].viewport,{width:390,height:844});
      const png=await readFile(join(narrowDir,'step-01.png'));assert.equal(png.readUInt32BE(16),390);assert.equal(png.readUInt32BE(20),844);
      assert.deepEqual(await readFile(join(out,'step-01.png')),wide,'narrow captures preserve wide artifacts');
      assert.match(log, /warnings are advisory/);
      assert.match(log, /ADVISORY step 0/);
    });
  },
);
test(
  "E2E-001 npm verify builds the whole app and renders nine normative steps on IPv4",
  { timeout: 180000 },
  async () => {
    await disposable("reference-", async (dir) => {
      await copyApp(dir);
      const log = await run(["npm", "run", "verify"], dir);
      for (let i = 0; i < 9; i++)
        assert.match(log, new RegExp(`step ${i} rendered`));
      assert.match(log, /http:\/\/127\.0\.0\.1:/);
      assert.match(log, /PASS build \/ sample \/ render/);
      assert.match(log, /Preview cleaned up/);
      const geometry = `import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {withPreview,visitSteps} from './scripts/browser.mjs';
await withPreview(async(browser,url)=>{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const folder='artifacts/composition/'+viewport.width+'x'+viewport.height;await mkdir(folder,{recursive:true});
  await visitSteps(browser,url,'how-to-make-a-presentation',{viewport,onStep:async(page,index)=>{
   if(![0,1,6,8].includes(index))return;
   const measured=await page.evaluate(()=>{
    const box=(selector)=>{const el=document.querySelector(selector);const r=el.getBoundingClientRect();return {x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
    const entity=id=>'[data-presentation-entity="how-to:'+id+'"]';
    const result={canvas:box('[data-presentation-canvas]'),scale:box('[data-presentation-canvas]').width/880};
    if(document.querySelector('.conversation-arrows line'))Object.assign(result,{line:box('.conversation-arrows line'),you:box(entity('you')),skill:box(entity('skill')),prompt:box(entity('prompt'))});
    if(document.querySelector('[data-presentation-reveal-label]')){const label=document.querySelector('[data-presentation-reveal-label]');const range=document.createRange();range.selectNodeContents(label);const text=range.getBoundingClientRect();Object.assign(result,{frame:box(entity('reveal')),label:box('[data-presentation-reveal-label]'),chip:box(entity('question')),text:{top:text.top,bottom:text.bottom,left:text.left,right:text.right}})};
    return result;
   });
   assert.ok(measured.canvas.left>=0&&measured.canvas.right<=viewport.width,'scaled canvas fits viewport horizontally');
   assert.ok(measured.canvas.top>=0&&measured.canvas.bottom<=viewport.height,'scaled canvas fits viewport vertically');
   if(index>=1){assert.ok(Math.abs(measured.line.left-measured.you.right)<1);assert.ok(Math.abs(measured.line.right-measured.skill.left)<1);assert.ok(Math.abs(measured.line.top-(measured.you.top+measured.you.height/2))<1);assert.ok(measured.prompt.top>measured.line.bottom)}
   if(index===8){const {label,frame,chip,text,scale}=measured;assert.ok(label.top>=frame.top+8*scale);assert.ok(text.top>=label.top-1&&text.bottom<=label.bottom+1,'reveal text fits line box');assert.ok(label.left>=frame.left&&label.right<=frame.right);assert.ok(label.right+8*scale<=chip.left||label.bottom+8*scale<=chip.top,'reveal label separated from question chip')}
   await page.screenshot({path:folder+'/step-'+index+'.png'});
   console.log('composition '+viewport.width+'x'+viewport.height+' step '+index+' '+JSON.stringify(measured));
  }});
 }
});`;
      await writeFile(join(dir,'composition.mjs'),geometry);
      await run(['node','composition.mjs'],dir);
      if(process.env.PRESENTATION_TEST_ARTIFACTS) await cp(join(dir,'artifacts/composition'),join(process.env.PRESENTATION_TEST_ARTIFACTS,'sample-composition'),{recursive:true});

    });
  },
);
test(
  "E2E-002 failures identify phase and step and clean up preview subprocesses",
  { timeout: 300000 },
  async (t) => {
    const faults = [
      [
        "build",
        "src/main.tsx",
        (s) =>
          s + '\nconst broken: number = "not a number"; console.log(broken)\n',
        /FAIL build/,
      ],
      [
        "missing",
        "src/presentations/index.ts",
        (s) => s.replace("export const presentations = [", "export const presentations = [/* removed sample */").replace(/\{\s*slug:[\s\S]*?\},?/, ""),
        /FAIL sample: sample missing registration: how-to-make-a-presentation/,
      ],
      [
        "unregistered",
        "src/presentations/index.ts",
        (s) =>
          s.replace(/slug:\s*"how-to-make-a-presentation"/, 'slug: "unregistered"'),
        /FAIL sample: sample missing registration: how-to-make-a-presentation/,
      ],
      [
        "missing-entry",
        "src/presentations/how-to-make-a-presentation/Talk.tsx",
        s=>s+'\n// removed in fixture below',
        /FAIL sample: sample missing entry module: how-to-make-a-presentation/,
      ],
      [
        "out-of-order",
        "src/presentations/how-to-make-a-presentation/steps/index.ts",
        (s) => s.replace(/\[s1,\s*s2/, "[s2, s1"),
        /FAIL render: render step 0: sample title mismatch/,
      ],
      [
        "console",
        "src/presentations/how-to-make-a-presentation/steps/Scene.tsx",
        (s) =>
          s.replace(
            "  return (",
            "  if(beat===2)console.error('fault console'); return (",
          ),
        /FAIL render: render step 1: fault console/,
      ],
      [
        "pageerror",
        "src/presentations/how-to-make-a-presentation/steps/Scene.tsx",
        (s) =>
          s.replace(
            "  return (",
            "  if(beat===2)setTimeout(()=>{throw new Error('fault page')},20); return (",
          ),
        /FAIL render: render step 1: fault page/,
      ],
      [
        "renderthrow",
        "src/presentations/how-to-make-a-presentation/steps/Scene.tsx",
        (s) => s.replace("  return (", "  if(beat===2)throw new Error('fault render'); return ("),
        /FAIL render: render step 1:/,
      ],
      [
        "stuck",
        "src/presentation-kit/usePresentationNav.ts",
        (s) =>
          s.replace(
            "setIndex((i) => clamp(i + delta, count))",
            "setIndex((i) => i)",
          ),
        /FAIL render: render step 1: transition did not advance/,
      ],
    ];
    for (const [name, file, mutate, message] of faults)
      await t.test(name, () =>
        disposable(`fault-${name}-`, async (dir) => {
          await copyApp(dir);
          const p = join(dir, file);
          const original=await readFile(p,"utf8"); const mutated=mutate(original); assert.notEqual(mutated,original, `fault ${name} must actually change source`); await writeFile(p,mutated);
          if(name==='missing-entry')await rm(p);
          const { code, log } = await exec(["npm", "run", "verify"], dir);
          console.log(log);
          assert.notEqual(code, 0);
          assert.match(log, message);
          assert.doesNotMatch(log, /PASS build/);
          if(['missing','unregistered','missing-entry'].includes(name)) {
            assert.doesNotMatch(log,/FAIL render|locator.waitFor|Preview http/);
          }
          const url = log.match(/Preview (http:\/\/127\.0\.0\.1:\d+)/)?.[1];
          if (url) {
            assert.match(log, /Preview cleaned up/);
            await assert.rejects(fetch(url));
          }
        }),
      );
  },
);

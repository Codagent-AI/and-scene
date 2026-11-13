import {
  readdir,
  readFile,
  mkdir,
  writeFile,
  cp,
  access,
} from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
export const templates = join(
  dirname(fileURLToPath(import.meta.url)),
  "templates",
);
const exists = async (p) =>
  access(p).then(
    () => true,
    () => false,
  );
async function json(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return {};
  }
}
async function sourceFiles(dir) {
  let text = "";
  for (const item of await readdir(dir, { withFileTypes: true }).catch(
    () => [],
  )) {
    if (["node_modules", "dist", ".git"].includes(item.name)) continue;
    const p = join(dir, item.name);
    if (item.isDirectory()) text += await sourceFiles(p);
    else if (/\.(tsx?|jsx?)$/.test(item.name))
      text += "\n" + (await readFile(p, "utf8"));
  }
  return text;
}
export async function detect(dir) {
  const pkg = await json(join(dir, "package.json")),
    src = await sourceFiles(join(dir, "src"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return {
    build: !!(pkg.scripts?.build && deps.vite && deps.react && deps.typescript),
    kit:
      /\bStep\b/.test(src) &&
      /\bScene\b/.test(src) &&
      /\bPresentation\b/.test(src) &&
      /usePresentationNav/.test(src) &&
      /useFitScale/.test(src) &&
      /caption/.test(src),
    index: /slug\s*:/.test(src) && /load\s*:/.test(src) && /import\(/.test(src),
  };
}
export async function resolveTarget(dir) {
  dir = resolve(dir);
  const anchors = await detect(dir);
  if (anchors.kit && anchors.index) return dir;
  const pkg = await json(join(dir, "package.json"));
  return pkg.workspaces ||
    (await exists(join(dir, "pnpm-workspace.yaml"))) ||
    (await exists(join(dir, "packages"))) ||
    (await exists(join(dir, "apps")))
    ? join(dir, "presentations")
    : dir;
}
async function copyMissing(src, dest) {
  await mkdir(dest, { recursive: true });
  for (const item of await readdir(src, { withFileTypes: true })) {
    const from = join(src, item.name),
      to = join(dest, item.name);
    if (item.isDirectory()) {
      await mkdir(to, { recursive: true });
      await copyMissing(from, to);
    } else if (!(await exists(to))) await cp(from, to);
  }
}
export async function scaffold(
  input,
  { confirm = false, install = true } = {},
) {
  const root = resolve(input),
    target = await resolveTarget(root),
    anchors = await detect(target);
  if (anchors.build && anchors.kit && anchors.index)
    return { target, anchors, reused: true };
  const nonempty = (await readdir(root).catch(() => [])).length > 0;
  if (nonempty && !confirm)
    throw new Error(
      `Please confirm scaffold target ${target} before writes (--confirm)`,
    );
  await mkdir(target, { recursive: true });
  const bootstrap = join(templates, "bootstrap");
  if (!anchors.build) {
    // Build assets are separate from the kit, registry and entry-point anchors.
    for (const item of await readdir(bootstrap, { withFileTypes: true })) {
      if (["src", "scripts"].includes(item.name)) continue;
      const from = join(bootstrap, item.name),
        to = join(target, item.name);
      if (item.isDirectory()) await copyMissing(from, to);
      else if (!(await exists(to))) await cp(from, to);
    }
  }
  if (!anchors.kit)
    await copyMissing(
      join(bootstrap, "src", "presentation-kit"),
      join(target, "src", "presentation-kit"),
    );
  if (!anchors.index) {
    await copyMissing(
      join(bootstrap, "src", "presentations"),
      join(target, "src", "presentations"),
    );
    for (const file of ["Router.tsx", "Landing.tsx"])
      if (!(await exists(join(target, "src", file))))
        await cp(join(bootstrap, "src", file), join(target, "src", file));
  }
  if (!anchors.kit && !anchors.index) {
    for (const file of ["main.tsx", "index.css"])
      if (!(await exists(join(target, "src", file))))
        await cp(join(bootstrap, "src", file), join(target, "src", file));
  }
  await copyMissing(join(bootstrap, "scripts"), join(target, "scripts"));
  const pkg = await json(join(target, "package.json")),
    base = await json(join(bootstrap, "package.json"));
  for (const field of ["dependencies", "devDependencies", "scripts"])
    pkg[field] = { ...base[field], ...pkg[field] };
  pkg.type ??= "module";
  pkg.private ??= true;
  pkg.name ??= "and-scene-presentation";
  await writeFile(
    join(target, "package.json"),
    JSON.stringify(pkg, null, 2) + "\n",
  );
  if (install)
    await new Promise((resolve, reject) => {
      const child = spawn("npm", ["install"], {
        cwd: target,
        stdio: "inherit",
      });
      child.once("error", reject);
      child.once("exit", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`Dependency installation failed: ${code}`)),
      );
    });
  return { target, anchors, reused: false };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    console.log(
      JSON.stringify(
        await scaffold(process.argv[2] ?? ".", {
          confirm: process.argv.includes("--confirm"),
        }),
      ),
    );
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}

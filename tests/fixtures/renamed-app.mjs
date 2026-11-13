import { cp, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
// A real, buildable app with cosmetically different anchor locations.
export async function renamedApp(bootstrap, target) {
  await cp(bootstrap, target, { recursive: true });
  for (const [from, to] of [
    ["presentation-kit", "engine"],
    ["presentations", "stories"],
    ["Router.tsx", "Routes.tsx"],
    ["Landing.tsx", "Home.tsx"],
  ])
    await rename(join(target, "src", from), join(target, "src", to));
  async function rewrite(dir) {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, item.name);
      if (item.isDirectory()) await rewrite(path);
      else if (/\.(ts|tsx)$/.test(item.name)) {
        const source = await readFile(path, "utf8");
        await writeFile(
          path,
          source
            .replaceAll("presentation-kit", "engine")
            .replaceAll("./presentations", "./stories")
            .replaceAll("./Router", "./Routes")
            .replaceAll("./Landing", "./Home"),
        );
      }
    }
  }
  await rewrite(join(target, "src"));
}
export async function tree(dir) {
  const files = {};
  async function walk(path, prefix = "") {
    for (const item of await readdir(path, { withFileTypes: true })) {
      const relative = join(prefix, item.name),
        full = join(path, item.name);
      if (item.isDirectory()) await walk(full, relative);
      else files[relative] = await readFile(full, "utf8");
    }
  }
  await walk(dir);
  return files;
}

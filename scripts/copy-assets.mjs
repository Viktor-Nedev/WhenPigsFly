import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const run = async () => {
  const folders = ['assets', 'images'];
  for (const folder of folders) {
    const source = join(root, folder);
    const dest = join(root, 'public', folder);
    if (!existsSync(source)) {
      console.warn(`[copy-assets] Skipping: ${folder} folder not found.`);
      continue;
    }
    await mkdir(dest, { recursive: true });
    await cp(source, dest, { recursive: true, force: true });
    console.log(`[copy-assets] Copied ${folder} -> public/${folder}`);
  }
};

run().catch((err) => {
  console.error('[copy-assets] Failed:', err);
  process.exit(1);
});

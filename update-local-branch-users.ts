import { GITEA_URL } from '@/lib/env.ts';
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from 'node:process';

const USER_FROM = 'jo';
const USER_TO = 'robyn';

const HOME = env.HOME;
if (!HOME) throw new Error('HOME is not set');
const ROOT = join(HOME, 'Code');

const dirs = (await readdir(ROOT, { encoding: 'utf-8', recursive: false, withFileTypes: true })).filter((entry) =>
  entry.isDirectory()
).map(({ parentPath, name }) => join(parentPath, name)).toSorted((a, b) => a.localeCompare(b));

for (const dir of dirs) {
  const gitConfig = join(dir, '.git/config');
  if (!existsSync(gitConfig)) continue;
  const contents = await readFile(gitConfig, { encoding: 'utf-8' });
  const replaced = contents.replaceAll(new URL(USER_FROM, GITEA_URL).href, new URL(USER_TO, GITEA_URL).href);
  if (contents === replaced) continue;
  console.log(dir, { contents, replaced });
  await writeFile(gitConfig, replaced);
}

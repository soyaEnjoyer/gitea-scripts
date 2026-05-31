import { spawnSync } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from 'node:process';

const BRANCH_FROM = 'master';
const BRANCH_TO = 'main';

const HOME = env.HOME;

if (!HOME) throw new Error('HOME is not set');
const ROOT = join(HOME, 'Code');

const dirs = (await readdir(ROOT, { encoding: 'utf-8', recursive: false, withFileTypes: true })).filter((entry) =>
  entry.isDirectory()
).map(({ parentPath, name }) => join(parentPath, name)).toSorted((a, b) => a.localeCompare(b));

function git(args: string[], cwd: string): string[] {
  const result = spawnSync('git', args, { cwd, encoding: 'utf-8' });
  if (result.status) throw new Error(`"git ${args.join(' ')}" in "${cwd}" failed with code ${result.status}`);
  if (result.signal) throw new Error(`"git ${args.join(' ')}" in "${cwd}" killed by signal ${result.signal}`);
  return result.output.filter((token) => typeof token === 'string').flatMap((token) => token.split('\n')).filter((
    line,
  ) => line.length);
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

for (const dir of dirs) {
  if (!await exists(join(dir, '.git'))) continue;
  const branches = git(['branch'], dir).map((line) => line.replace(/^\*?\s+/, ''));
  if (!branches.includes(BRANCH_FROM)) continue;
  for (
    const command of [
      ['switch', BRANCH_FROM],
      ['switch', '-c', BRANCH_TO],
      ['pull'],
      ['branch', `--set-upstream-to=origin/${BRANCH_TO}`, BRANCH_TO],
      ['pull'],
      ['prune'],
    ]
  ) { git(command, dir); }
  console.log('updated', dir, 'to', BRANCH_TO);
}

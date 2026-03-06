import { GITEA_URL, headers } from '@/lib/env.ts';
import { repoSchema } from '@/lib/schemas.ts';
import { z } from '@zod/zod';

// https://docs.gitea.com/api/1.25/#tag/repository/operation/repoEdit

const BRANCH_FROM = 'master';
const BRANCH_TO = 'main';

const repos = await fetch(new URL('/api/v1/user/repos', GITEA_URL), { headers })
  .then((response) => response.json())
  .then((json) => z.array(repoSchema).parse(json));

for (const repo of repos) {
  if (repo.default_branch !== BRANCH_FROM) continue;

  const renameResponse = await fetch(new URL(`/api/v1/repos/${repo.full_name}/branches/${BRANCH_FROM}`), {
    headers,
    method: 'PATCH',
    body: JSON.stringify({ name: BRANCH_TO }),
  });
  if (!renameResponse.ok) throw new Error(`could not rename ${repo.full_name}:${repo.default_branch} -> ${BRANCH_TO}`);
  const setDefaultResponse = await fetch(new URL(`/api/v1/repos/${repo.full_name}`), {
    headers,
    method: 'PATCH',
    body: JSON.stringify({ default_branch: BRANCH_TO }),
  });
  if (!setDefaultResponse.ok) throw new Error(`could not set default branch to ${repo.full_name}:${BRANCH_TO}`);

  console.info('updated', repo.full_name);
}

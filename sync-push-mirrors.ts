import { GITEA_URL, headers } from '@/lib/env.ts';
import { pushMirrorGetSchema, repoSchema } from '@/lib/schemas.ts';
import { z } from '@zod/zod';
// https://docs.gitea.com/api/1.25/#tag/repository/operation/repoListPushMirrors

const repos = await fetch(new URL('/api/v1/user/repos?limit=1000', GITEA_URL), { headers })
  .then((response) => response.json())
  .then((json) => z.array(repoSchema).parse(json));

for (const repo of repos) {
  const pushMirrors = await fetch(new URL(`/api/v1/repos/${repo.full_name}/push_mirrors`, GITEA_URL), { headers })
    .then((response) => response.json())
    .then((json) => z.array(pushMirrorGetSchema).parse(json));
  if (!pushMirrors.length) continue;
  const response = await fetch(new URL(`/api/v1/repos/${repo.full_name}/push_mirrors-sync`, GITEA_URL), {
    headers,
    method: 'POST',
  });
  if (response.ok) console.log('syncing', repo.full_name);
  else console.error('error syncing', repo.full_name, await response.text(), response.statusText);
}

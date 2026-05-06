import { GITEA_URL, GITHUB_TOKEN, GITHUB_USER, headers } from '@/lib/env.ts';
import { pushMirrorGetSchema, PushMirrorPost, repoSchema } from '@/lib/schemas.ts';
import { z } from '@zod/zod';
// https://docs.gitea.com/api/1.25/#tag/repository/operation/repoListPushMirrors

const GITHUB_URL = 'https://github.com';
const PUSH_INTERVAL = '8h0m0s';

const repos = await fetch(new URL('/api/v1/user/repos?limit=1000', GITEA_URL), { headers })
  .then((response) => response.json())
  .then((json) => z.array(repoSchema).parse(json));

for (const repo of repos) {
  const pushMirrors = await fetch(new URL(`/api/v1/repos/${repo.full_name}/push_mirrors`, GITEA_URL), { headers })
    .then((response) => response.json())
    .then((json) => z.array(pushMirrorGetSchema).parse(json));
  if (!pushMirrors.length) continue;
  console.debug(repo, pushMirrors);

  const remoteRepos = new Set(
    pushMirrors.map((mirror) => mirror.remote_address.split('/').at(-1)).filter((name) => typeof name === 'string'),
  );
  if (remoteRepos.size !== 1) throw new Error(`unexpected remote repo count: ${JSON.stringify(remoteRepos)}`);
  const remoteRepo = [...remoteRepos][0];

  const post: PushMirrorPost = {
    interval: PUSH_INTERVAL,
    remote_address: new URL(`${GITHUB_USER}/${remoteRepo}`, GITHUB_URL).href,
    remote_password: GITHUB_TOKEN,
    remote_username: GITHUB_USER,
    sync_on_commit: true,
  };

  let updated = false;

  if (pushMirrors.find((mirror) => mirror.remote_address.replace(/\/$/, '') === post.remote_address))
    console.debug(`${post.remote_address} already exists`);
  else {
    const createResponse = await fetch(
      new URL(`/api/v1/repos/${repo.full_name}/push_mirrors`, GITEA_URL),
      { headers, method: 'POST', body: JSON.stringify(post) },
    );
    if (!createResponse.ok) throw new Error(`could not create push mirror: ${await createResponse.text()}`);
    updated = true;
  }

  for (const pushMirror of pushMirrors) {
    if (pushMirror.remote_address.replace(/\/$/, '') === post.remote_address) continue;
    console.warn(`deleting ${pushMirror.remote_address}`);
    const deleteResponse = await fetch(
      new URL(`/api/v1/repos/${repo.full_name}/push_mirrors/${pushMirror.remote_name}`, GITEA_URL),
      {
        headers,
        method: 'DELETE',
      },
    );
    if (!deleteResponse.ok) throw new Error(`could not delete push mirror: ${await deleteResponse.text()}`);
    console.info('deleted', pushMirror.remote_address);
    updated = true;
  }

  console.info(repo.full_name, updated ? 'push mirrors updated' : 'no changes');
}

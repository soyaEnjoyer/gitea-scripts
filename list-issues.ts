import { GITEA_URL, headers } from '@/lib/env.ts';
import { issueSchema } from '@/lib/schemas.ts';
import { z } from '@zod/zod';

// https://docs.gitea.com/api/1.25/#tag/issue/operation/issueSearchIssues

const issues = await fetch(new URL('/api/v1/repos/issues/search?state=open&type=issues&limit=1000', GITEA_URL), {
  headers,
})
  .then((response) => response.json())
  .then((json) =>
    z.array(issueSchema).parse(json).toSorted((a, b) =>
      a.repository.full_name.localeCompare(b.repository.full_name) || a.id - b.id
    )
  );

let prevRepo: string | null = null;
const maxWidth = issues.reduce((acc, item) => Math.max(acc, item.title.length), 0);
for (const issue of issues) {
  if (issue.repository.full_name !== prevRepo) {
    console.log(issue.repository.full_name);
    prevRepo = issue.repository.full_name;
  }
  console.log(`  ${issue.title} ${' '.repeat(maxWidth - issue.title.length)} ${issue.html_url}`);
}

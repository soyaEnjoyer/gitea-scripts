import { z } from '@zod/zod';

export const issueSchema = z.object({
  id: z.int(),
  title: z.string(),
  html_url: z.string(),
  state: z.string(),
  repository: z.object({
    name: z.string(),
    full_name: z.string(),
  }),
  labels: z.array(z.object({
    name: z.string(),
  })),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const repoSchema = z.object({
  id: z.int(),
  name: z.string(),
  full_name: z.string(),
  default_branch: z.string(),
});

export const pushMirrorGetSchema = z.object({
  created: z.coerce.date(),
  interval: z.string(),
  last_error: z.string(),
  last_update: z.coerce.date(),
  remote_address: z.string(),
  remote_name: z.string(),
  sync_on_commit: z.boolean(),
});

export interface PushMirrorPost {
  interval: string;
  remote_address: string;
  remote_password: string;
  remote_username: string;
  sync_on_commit: boolean;
}

import { loadSync } from '@std/dotenv';
import process from 'node:process';

loadSync({ export: true });

const GITEA_TOKEN = process.env.GITEA_TOKEN as string;
const GITEA_URL = process.env.GITEA_URL as string;
const GITHUB_USER = process.env.GITHUB_USER as string;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN as string;
if (!GITEA_TOKEN || !GITEA_URL || !GITHUB_USER || !GITHUB_TOKEN)
  throw new Error('One or more env vars are missing');

export { GITEA_TOKEN, GITEA_URL, GITHUB_TOKEN, GITHUB_USER };

export const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `token ${GITEA_TOKEN}`,
};

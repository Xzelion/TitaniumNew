import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parsePageDocument } from '../../shared/page-model/schema';
import type { PageDocument } from '../../shared/page-model/types';

export function loadDrafts(): PageDocument[] {
  const dir = path.join(process.cwd(), 'migration/drafts');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => parsePageDocument(JSON.parse(readFileSync(path.join(dir, file), 'utf8'))));
}

export function draftSlug(page: PageDocument): string {
  return page.path.replace(/^\/|\/$/g, '');
}

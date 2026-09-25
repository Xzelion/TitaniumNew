import { createHash } from 'node:crypto'
import type { PageDocument } from './types'

export function hashSource(html: string): string {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  const normalized = withoutScripts.replace(/\s+/g, ' ').trim()
  return createHash('sha256').update(normalized).digest('hex')
}

export interface GateResult {
  action: 'write' | 'skip'
  draft: PageDocument
  reason: string
}

export function gateConversion(existing: PageDocument | null, incoming: PageDocument): GateResult {
  if (!existing) {
    return { action: 'write', draft: incoming, reason: 'New private draft.' }
  }
  if (existing.editedByHuman) {
    return {
      action: 'skip',
      draft: existing,
      reason: 'A person has edited this draft. The converter will not overwrite it.',
    }
  }
  if (existing.provenance.sourceHash === incoming.provenance.sourceHash) {
    return {
      action: 'skip',
      draft: existing,
      reason: 'Source hash is unchanged.',
    }
  }
  const replacement = structuredClone(incoming)
  replacement.id = existing.id
  return {
    action: 'write',
    draft: replacement,
    reason: 'Source changed and nobody has edited the draft, so it was rebuilt.',
  }
}

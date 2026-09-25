'use client'

import { useEffect, useMemo, useState } from 'react'
import { ledgerForDocument, planningEntries, type LedgerEntry } from '../../../shared/page-model/ledger'
import { isPageDocument } from '../../../shared/page-model/schema'

interface PagesResponse {
  docs?: Array<{ id?: number | string; layout?: unknown }>
}

export function ReadinessHome() {
  return <ReadinessBoard heading="Layout editing readiness" />
}

export function ReadinessList() {
  return <ReadinessBoard heading="Layout editing readiness" />
}

function ReadinessBoard({ heading }: { heading: string }) {
  const [entries, setEntries] = useState<LedgerEntry[]>(planningEntries())
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('All')
  const [editing, setEditing] = useState('All')

  useEffect(() => {
    let cancelled = false
    void fetch('/api/pages?limit=50&depth=0', { credentials: 'include' })
      .then((response) => response.json() as Promise<PagesResponse>)
      .then((body) => {
        if (cancelled) return
        const pages = (body.docs ?? [])
          .map((doc) => {
            if (!isPageDocument(doc.layout)) return null
            const href = doc.id === undefined ? null : `/admin/collections/pages/${doc.id}`
            return ledgerForDocument(doc.layout, href)
          })
          .filter((entry): entry is LedgerEntry => entry !== null)
        setEntries(pages.length > 0 ? [...pages, ...planningEntries()] : planningEntries())
      })
      .catch(() => {
        if (!cancelled) setEntries(planningEntries())
      })
    return () => {
      cancelled = true
    }
  }, [])

  const regions = useMemo(() => ['All', ...new Set(entries.map((entry) => entry.region))], [entries])
  const labels = useMemo(() => ['All', ...new Set(entries.map((entry) => entry.layoutEditing))], [entries])
  const visible = entries.filter((entry) => {
    const haystack = `${entry.title} ${entry.path} ${entry.layoutDetail}`.toLowerCase()
    if (query && !haystack.includes(query.toLowerCase())) return false
    if (region !== 'All' && entry.region !== region) return false
    if (editing !== 'All' && entry.layoutEditing !== editing) return false
    return true
  })

  return (
    <section aria-label={heading} style={{ margin: '1rem 0', fontFamily: 'Inter, Arial, sans-serif' }}>
      <h2 style={{ marginBottom: '0.25rem' }}>{heading}</h2>
      <p style={{ marginTop: 0 }}>
        These notes describe this candidate. No page here is a hosted conversion, and none are released on titanium.com.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <label>
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} style={{ display: 'block' }} />
        </label>
        <label>
          Site area
          <select value={region} onChange={(event) => setRegion(event.target.value)} style={{ display: 'block' }}>
            {regions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Layout editing
          <select value={editing} onChange={(event) => setEditing(event.target.value)} style={{ display: 'block' }}>
            {labels.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Page', 'Layout editing', 'Visual check', 'Published version', 'Last checked', 'Open'].map((cell) => (
              <th key={cell} style={{ textAlign: 'left', borderBottom: '1px solid #cbd5e1', padding: '0.4rem' }}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((entry) => (
            <tr key={`${entry.path}-${entry.title}`}>
              <td style={{ padding: '0.45rem', verticalAlign: 'top' }}>
                <strong>{entry.title}</strong>
                <div>{entry.path}</div>
                <div>{entry.region}</div>
              </td>
              <td style={{ padding: '0.45rem', verticalAlign: 'top' }}>
                <strong>{entry.layoutEditing}</strong>
                <div>{entry.layoutDetail}</div>
              </td>
              <td style={{ padding: '0.45rem', verticalAlign: 'top' }}>
                <strong>{entry.visualCheck}</strong>
                <div>{entry.visualDetail}</div>
              </td>
              <td style={{ padding: '0.45rem', verticalAlign: 'top' }}>{entry.publishedVersion}</td>
              <td style={{ padding: '0.45rem', verticalAlign: 'top' }}>{entry.lastChecked}</td>
              <td style={{ padding: '0.45rem', verticalAlign: 'top' }}>
                {entry.editorHref ? <a href={entry.editorHref}>Open editor</a> : 'No editor yet'}
                {entry.liveHref ? (
                  <div>
                    <a href={entry.liveHref}>Live site, not this draft</a>
                  </div>
                ) : null}
                <details>
                  <summary>Technical evidence</summary>
                  <p>{entry.evidence}</p>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

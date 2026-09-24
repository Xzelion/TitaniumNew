'use client'

import { useField } from '@payloadcms/ui'
import { useEffect, useRef } from 'react'
import { mountWorkspace } from '../../../shared/editor/mount'
import { isPageDocument } from '../../../shared/page-model/schema'
import type { PageDocument } from '../../../shared/page-model/types'

interface PayloadColumnFieldProps {
  path: string
}

export function PayloadColumnField({ path }: PayloadColumnFieldProps) {
  const { value, setValue } = useField<PageDocument>({ path })
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  const ready = isPageDocument(value)

  const setValueRef = useRef(setValue)
  setValueRef.current = setValue

  useEffect(() => {
    if (!ready || !ref.current || started.current) return
    started.current = true
    const controller = mountWorkspace(ref.current, value, (next) => {
      setValueRef.current(next)
    })
    return () => {
      controller.destroy()
    }
  }, [ready])

  if (!ready) {
    return <p>This page has no layout yet. Run the seed script to load a private draft.</p>
  }

  return <div ref={ref} />
}

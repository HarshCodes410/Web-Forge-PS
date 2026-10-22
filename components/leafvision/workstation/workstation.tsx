'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, RotateCcw, ScanLine, Trash2 } from 'lucide-react'
import { ApiError, formatBytes, isApiConfigured, predictLeaves, validateFile } from '@/lib/api'
import { buttonStyles } from '@/lib/styles'
import { cn } from '@/lib/utils'
import type { BackendStatus } from '@/hooks/use-backend-health'
import { SectionHeader } from '../section-header'
import { BackendNotice } from './backend-notice'
import { Dropzone } from './dropzone'
import { OutputView, type OutputState } from './output-view'
import { PanelFrame } from './panel-frame'
import { ResultMetrics } from './result-metrics'

type Selected = { file: File; previewUrl: string }

export function Workstation({
  status,
  onRecheck,
  isRechecking,
}: {
  status: BackendStatus
  onRecheck: () => void
  isRechecking: boolean
}) {
  const [selected, setSelected] = useState<Selected | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [output, setOutput] = useState<OutputState>({ kind: 'empty' })
  const [downloading, setDownloading] = useState(false)
  const requestId = useRef(0)
  const urlsRef = useRef<{ preview: string | null; result: string | null }>({ preview: null, result: null })

  useEffect(() => {
    const urls = urlsRef.current
    return () => {
      if (urls.preview) URL.revokeObjectURL(urls.preview)
      if (urls.result) URL.revokeObjectURL(urls.result)
    }
  }, [])

  function releaseResult() {
    if (urlsRef.current.result) {
      URL.revokeObjectURL(urlsRef.current.result)
      urlsRef.current.result = null
    }
  }

  function handleFile(file: File) {
    const error = validateFile(file)
    if (error) {
      setFileError(error)
      return
    }
    setFileError(null)
    if (urlsRef.current.preview) URL.revokeObjectURL(urlsRef.current.preview)
    releaseResult()
    const previewUrl = URL.createObjectURL(file)
    urlsRef.current.preview = previewUrl
    requestId.current += 1
    setSelected({ file, previewUrl })
    setOutput({ kind: 'empty' })
  }

  function clearAll() {
    if (urlsRef.current.preview) URL.revokeObjectURL(urlsRef.current.preview)
    urlsRef.current.preview = null
    releaseResult()
    requestId.current += 1
    setSelected(null)
    setFileError(null)
    setOutput({ kind: 'empty' })
  }

  async function runSegmentation() {
    if (!selected) return
    const id = ++requestId.current
    releaseResult()
    setOutput({ kind: 'processing' })
    try {
      const result = await predictLeaves(selected.file)
      if (id !== requestId.current) {
        if (result.isObjectUrl) URL.revokeObjectURL(result.imageUrl)
        return
      }
      if (result.isObjectUrl) urlsRef.current.result = result.imageUrl
      setOutput({ kind: 'success', result })
      onRecheck()
    } catch (err) {
      if (id !== requestId.current) return
      const message = err instanceof ApiError ? err.message : 'An unexpected error occurred while segmenting the image.'
      setOutput({ kind: 'error', message })
    }
  }

  async function downloadResult() {
    if (output.kind !== 'success' || !selected) return
    setDownloading(true)
    try {
      const res = await fetch(output.result.imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const baseName = selected.file.name.replace(/\.[^.]+$/, '')
      const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
      a.href = url
      a.download = `${baseName}-segmented.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(output.result.imageUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setDownloading(false)
    }
  }

  const processing = output.kind === 'processing'
  const outputTag =
    output.kind === 'success'
      ? 'Complete'
      : output.kind === 'processing'
        ? 'Processing'
        : output.kind === 'error'
          ? 'Error'
          : 'Idle'
  const outputTone =
    output.kind === 'success' ? 'primary' : output.kind === 'processing' ? 'accent' : output.kind === 'error' ? 'destructive' : 'muted'

  return (
    <section id="workstation" aria-labelledby="workstation-title" className="flex scroll-mt-24 flex-col gap-6">
      <SectionHeader
        id="workstation-title"
        eyebrow="01 / Segmentation Lab"
        title="Upload & Segment"
        description="Send a plant image to the deployed Mask R-CNN model. The original image and the model's real segmentation output are shown side by side."
      />

      <BackendNotice status={status} onRecheck={onRecheck} isRechecking={isRechecking} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PanelFrame
          title="Input Image"
          tag={selected ? 'Loaded' : 'Empty'}
          tagTone={selected ? 'accent' : 'muted'}
          footer={
            selected ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <dl className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
                  <div className="flex min-w-0 gap-2">
                    <dt className="text-muted-foreground">File</dt>
                    <dd className="truncate text-foreground" title={selected.file.name}>
                      {selected.file.name}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Size</dt>
                    <dd className="text-foreground">{formatBytes(selected.file.size)}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={processing}
                  className="inline-flex shrink-0 items-center gap-2 self-start font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Clear
                </button>
              </div>
            ) : undefined
          }
        >
          {selected ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-border bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={selected.previewUrl} alt={`Uploaded plant image: ${selected.file.name}`} className="size-full object-contain" />
            </div>
          ) : (
            <Dropzone onFile={handleFile} />
          )}
        </PanelFrame>

        <PanelFrame title="Segmentation Output" tag={outputTag} tagTone={outputTone}>
          <OutputView state={output} previewUrl={selected?.previewUrl ?? null} />
        </PanelFrame>
      </div>

      {fileError && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {fileError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={runSegmentation}
          disabled={!selected || processing || !isApiConfigured}
          className={buttonStyles.primary}
        >
          {processing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ScanLine className="size-4" aria-hidden="true" />}
          {processing ? 'Segmenting…' : output.kind === 'error' ? 'Retry Segmentation' : 'Segment Leaves'}
        </button>
        {selected && (
          <label className={cn(buttonStyles.ghost, 'cursor-pointer', processing && 'pointer-events-none opacity-40')}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Replace Image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={processing}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />
          </label>
        )}
        {!isApiConfigured && selected && (
          <p className="text-sm text-muted-foreground">Connect a backend to enable segmentation.</p>
        )}
      </div>

      {output.kind === 'success' && (
        <ResultMetrics result={output.result} onDownload={downloadResult} downloading={downloading} />
      )}
    </section>
  )
}

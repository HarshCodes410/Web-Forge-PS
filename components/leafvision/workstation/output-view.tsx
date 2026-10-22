'use client'

import { useState } from 'react'
import { AlertTriangle, Flame, Layers, Loader2, ScanSearch, Sprout, TriangleAlert } from 'lucide-react'
import type { PredictionResult } from '@/lib/api'
import { cn } from '@/lib/utils'

export type OutputState =
  | { kind: 'empty' }
  | { kind: 'processing' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; result: PredictionResult }

type ViewMode = 'colored' | 'damage' | 'original'

export function OutputView({ state, previewUrl }: { state: OutputState; previewUrl: string | null }) {
  const [viewMode, setViewMode] = useState<ViewMode>('colored')

  if (state.kind === 'success') {
    const { result } = state
    const isCrop = result.prediction?.toLowerCase() === 'crop'
    const isWeed = result.prediction?.toLowerCase() === 'weed'
    const confidencePct =
      result.confidence !== null && result.confidence !== undefined
        ? (result.confidence * 100).toFixed(1)
        : null

    const coloredImg = result.coloredOverlayImage ?? result.imageUrl
    const damageImg = result.damageOverlayImage ?? result.imageUrl

    const currentSrc =
      viewMode === 'colored'
        ? coloredImg
        : viewMode === 'damage'
          ? damageImg
          : (previewUrl ?? result.imageUrl)

    const isHealthyResult = (result.damagePercentage ?? 0) < 5.0

    return (
      <div className="flex flex-col gap-3">
        {/* View Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('colored')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                viewMode === 'colored'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Layers className="size-3.5" aria-hidden="true" />
              Colored Leaves
            </button>

            {result.damageOverlayImage && (
              <button
                type="button"
                onClick={() => setViewMode('damage')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  viewMode === 'damage'
                    ? 'bg-card text-destructive shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Flame className="size-3.5" aria-hidden="true" />
                Damage Heatmap
              </button>
            )}

            {previewUrl && (
              <button
                type="button"
                onClick={() => setViewMode('original')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  viewMode === 'original'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Original Photo
              </button>
            )}
          </div>

          {result.leafCount !== null && (
            <span className="font-mono text-xs text-primary font-semibold">
              {result.leafCount} {result.leafCount === 1 ? 'Leaf' : 'Leaves'}
            </span>
          )}
        </div>

        {/* Visual Canvas Display */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-border bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic base64 or blob URL */}
          <img
            src={currentSrc}
            alt="Phenotyping visual inspection"
            className="size-full object-contain"
          />

          {/* Badges Overlay */}
          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
            {result.prediction && (
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-black/85 px-2.5 py-1 text-xs shadow-md backdrop-blur-md">
                {isCrop ? (
                  <Sprout className="size-3.5 text-primary" aria-hidden="true" />
                ) : isWeed ? (
                  <TriangleAlert className="size-3.5 text-amber-500" aria-hidden="true" />
                ) : null}
                <span
                  className={cn(
                    'font-mono font-bold uppercase tracking-wider',
                    isCrop ? 'text-primary' : isWeed ? 'text-amber-500' : 'text-foreground',
                  )}
                >
                  {result.prediction}
                </span>
                {confidencePct && <span className="font-mono text-muted-foreground">{confidencePct}%</span>}
              </div>
            )}

            {/* Health Result Badge */}
            <div
              className={cn(
                'rounded-md border px-2.5 py-1 font-mono text-xs font-semibold shadow-md backdrop-blur-md',
                isHealthyResult
                  ? 'border-primary/40 bg-black/85 text-primary'
                  : 'border-destructive/60 bg-black/85 text-destructive',
              )}
            >
              {result.healthResult ?? 'Result: Healthy'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state.kind === 'processing') {
    return (
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-md border border-primary/30 bg-black">
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- local preview
          <img src={previewUrl} alt="" className="absolute inset-0 size-full object-contain opacity-30 blur-[1px]" />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 h-px animate-[scan_2.2s_ease-in-out_infinite] bg-primary shadow-[0_0_16px_2px] shadow-primary/60"
        />
        <div className="relative flex flex-col items-center gap-3 text-center" role="status" aria-live="polite">
          <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Running Phenotyping &amp; AI Analysis</p>
          <p className="text-sm text-muted-foreground">Counting leaves, measuring area &amp; screening damage&hellip;</p>
        </div>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div
        role="alert"
        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-6 text-center"
      >
        <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-destructive">Inference Failed</p>
        <p className="max-w-sm text-pretty text-sm leading-relaxed text-foreground/80">{state.message}</p>
      </div>
    )
  }

  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-background/40 p-6 text-center">
      <ScanSearch className="size-7 text-muted-foreground" aria-hidden="true" />
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Awaiting Input</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Upload a plant image and press <span className="text-foreground">Analyze Plant</span> to count leaves, view colored masks, and inspect damage area.
      </p>
    </div>
  )
}

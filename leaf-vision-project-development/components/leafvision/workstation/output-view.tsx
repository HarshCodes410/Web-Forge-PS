import { AlertTriangle, Loader2, ScanSearch } from 'lucide-react'
import type { PredictionResult } from '@/lib/api'

export type OutputState =
  | { kind: 'empty' }
  | { kind: 'processing' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; result: PredictionResult }

export function OutputView({ state, previewUrl }: { state: OutputState; previewUrl: string | null }) {
  if (state.kind === 'success') {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-border bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element -- result comes from a dynamic backend URL or blob */}
        <img src={state.result.imageUrl} alt="Segmentation output with individual leaves masked" className="size-full object-contain" />
      </div>
    )
  }

  if (state.kind === 'processing') {
    return (
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-md border border-primary/30 bg-black">
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img src={previewUrl} alt="" className="absolute inset-0 size-full object-contain opacity-30 blur-[1px]" />
        )}
        <div aria-hidden="true" className="absolute inset-x-0 h-px animate-[scan_2.2s_ease-in-out_infinite] bg-primary shadow-[0_0_16px_2px] shadow-primary/60" />
        <div className="relative flex flex-col items-center gap-3 text-center" role="status" aria-live="polite">
          <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Running Mask R-CNN inference</p>
          <p className="text-sm text-muted-foreground">Detecting and masking leaf instances&hellip;</p>
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
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-destructive">Segmentation failed</p>
        <p className="max-w-sm text-pretty text-sm leading-relaxed text-foreground/80">{state.message}</p>
      </div>
    )
  }

  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-background/40 p-6 text-center">
      <ScanSearch className="size-7 text-muted-foreground" aria-hidden="true" />
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Awaiting input</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Upload an image and press <span className="text-foreground">Segment Leaves</span> to see the model output here.
      </p>
    </div>
  )
}

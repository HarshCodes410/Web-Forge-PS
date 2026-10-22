import { Download, Loader2 } from 'lucide-react'
import type { PredictionResult } from '@/lib/api'
import { buttonStyles, panelStyles } from '@/lib/styles'
import { cn } from '@/lib/utils'

export function ResultMetrics({
  result,
  onDownload,
  downloading,
}: {
  result: PredictionResult
  onDownload: () => void
  downloading: boolean
}) {
  const scored = result.instances.filter((i) => i.score !== null)
  const meanScore = scored.length > 0 ? scored.reduce((sum, i) => sum + (i.score ?? 0), 0) / scored.length : null

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Leaf Instances" value={result.leafCount !== null ? String(result.leafCount) : 'Not reported'} highlight />
        <Metric
          label="Mean Confidence"
          value={meanScore !== null ? `${(meanScore * 100).toFixed(1)}%` : 'Not reported'}
        />
        <Metric
          label="Inference Time"
          value={result.inferenceMs !== null ? `${Math.round(result.inferenceMs)} ms` : 'Not reported'}
        />
      </div>

      {scored.length > 0 && (
        <div className={cn(panelStyles, 'overflow-hidden')}>
          <p className="label-mono border-b border-border px-4 py-3">Detected Instances</p>
          <ul className="grid max-h-56 grid-cols-2 gap-px overflow-y-auto bg-border sm:grid-cols-4">
            {scored.map((instance) => (
              <li key={instance.id} className="flex items-center justify-between gap-2 bg-card px-4 py-2.5 font-mono text-xs">
                <span className="text-muted-foreground">
                  {instance.label ?? 'leaf'} #{instance.id}
                </span>
                <span className="text-primary">{((instance.score ?? 0) * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" onClick={onDownload} disabled={downloading} className={cn(buttonStyles.accent, 'self-start')}>
        {downloading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
        Download Result
      </button>
    </div>
  )
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const isEmpty = value === 'Not reported'
  return (
    <div className={cn(panelStyles, 'flex flex-col gap-3 p-4')}>
      <p className="label-mono text-[10px]">{label}</p>
      <p
        className={cn(
          'font-medium',
          isEmpty ? 'text-sm text-muted-foreground' : highlight ? 'text-4xl text-primary' : 'text-2xl text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  )
}

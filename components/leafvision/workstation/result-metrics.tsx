import { Activity, CheckCircle2, Download, FileJson, Flame, Layers, Loader2, ShieldAlert, Sprout, TriangleAlert } from 'lucide-react'
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
  const isCrop = result.prediction?.toLowerCase() === 'crop'
  const isWeed = result.prediction?.toLowerCase() === 'weed'

  const confidencePct =
    result.confidence !== null && result.confidence !== undefined
      ? (result.confidence * 100).toFixed(1)
      : null

  const cropProb = result.probabilities?.Crop ?? (isCrop && result.confidence ? result.confidence : 0)
  const weedProb = result.probabilities?.Weed ?? (isWeed && result.confidence ? result.confidence : 0)

  const hasLeaves = Array.isArray(result.leaves) && result.leaves.length > 0
  const isHealthyResult = (result.damagePercentage ?? 0) < 5.0

  function downloadJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `leafvision-phenotyping-report-${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  function downloadDamageHeatmap() {
    if (!result.damageOverlayImage) return
    const a = document.createElement('a')
    a.href = result.damageOverlayImage
    a.download = `damage-heatmap-${Date.now()}.jpg`
    a.click()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 4 Core Phenotyping & Health Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Metric 1: Leaf Count */}
        <div className={cn(panelStyles, 'flex flex-col justify-between p-4')}>
          <div className="flex items-center justify-between">
            <p className="label-mono text-[10px]">Leaf Count</p>
            <Layers className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-primary">
              {result.leafCount !== null ? result.leafCount : '—'}
            </span>
            <span className="text-xs text-muted-foreground">leaves</span>
          </div>
        </div>

        {/* Metric 2: Total Surface Area */}
        <div className={cn(panelStyles, 'flex flex-col justify-between p-4')}>
          <div className="flex items-center justify-between">
            <p className="label-mono text-[10px]">Total Surface Area</p>
            <Activity className="size-4 text-accent" aria-hidden="true" />
          </div>
          <div className="mt-2 flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {result.totalLeafAreaPixels ? `${result.totalLeafAreaPixels.toLocaleString()} px` : '—'}
            </span>
            {result.canopyCoveragePct !== undefined && result.canopyCoveragePct !== null && (
              <span className="font-mono text-xs text-muted-foreground">
                {result.canopyCoveragePct}% canopy cover
              </span>
            )}
          </div>
        </div>

        {/* Metric 3: Health Status & Damage Area */}
        <div className={cn(panelStyles, 'flex flex-col justify-between p-4')}>
          <div className="flex items-center justify-between">
            <p className="label-mono text-[10px]">Health &amp; Damage</p>
            {isHealthyResult ? (
              <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
            ) : (
              <ShieldAlert className="size-4 text-destructive" aria-hidden="true" />
            )}
          </div>
          <div className="mt-2 flex flex-col">
            <span
              className={cn(
                'text-lg font-bold tracking-tight',
                isHealthyResult ? 'text-primary' : 'text-destructive',
              )}
            >
              {result.healthResult ?? 'Result: Healthy'}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {result.damagePercentage !== undefined && result.damagePercentage !== null
                ? `${result.damagePercentage.toFixed(1)}% damage area`
                : '—'}
            </span>
          </div>
        </div>

        {/* Metric 4: Crop vs Weed */}
        <div className={cn(panelStyles, 'flex flex-col justify-between p-4')}>
          <div className="flex items-center justify-between">
            <p className="label-mono text-[10px]">Classification</p>
            {isCrop ? (
              <Sprout className="size-4 text-primary" aria-hidden="true" />
            ) : isWeed ? (
              <TriangleAlert className="size-4 text-amber-500" aria-hidden="true" />
            ) : null}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={cn(
                'text-2xl font-bold tracking-tight',
                isCrop ? 'text-primary' : isWeed ? 'text-amber-500' : 'text-foreground',
              )}
            >
              {result.prediction ?? '—'}
            </span>
            {confidencePct && <span className="font-mono text-xs text-muted-foreground">{confidencePct}%</span>}
          </div>
        </div>
      </div>

      {/* Detailed Healthy Area vs Damaged Area Panel */}
      <div className={cn(panelStyles, 'flex flex-col gap-3 p-4')}>
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <p className="label-mono text-[11px] font-semibold text-foreground">
              {result.healthResult ?? 'Result: Healthy'}
            </p>
            <span
              className={cn(
                'rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
                isHealthyResult
                  ? 'border border-primary/40 bg-primary/10 text-primary'
                  : 'border border-destructive/40 bg-destructive/10 text-destructive',
              )}
            >
              {result.damageSeverity ?? 'Healthy'}
            </span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            Total Foliage: {result.totalLeafAreaPixels?.toLocaleString()} px
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
          {/* Healthy Area Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="size-2 rounded-full bg-primary" />
                Healthy Area
              </span>
              <span className="font-mono font-semibold text-primary">
                {result.healthyPercentage?.toFixed(1) ?? '100.0'}% ({result.healthyAreaPixels?.toLocaleString()} px)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, result.healthyPercentage ?? 100))}%` }}
              />
            </div>
          </div>

          {/* Damaged Area Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="size-2 rounded-full bg-destructive" />
                Damage Area (Necrosis &amp; Lesions)
              </span>
              <span className="font-mono font-semibold text-destructive">
                {result.damagePercentage?.toFixed(1) ?? '0.0'}% ({result.damagedAreaPixels?.toLocaleString() ?? 0} px)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-destructive transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, result.damagePercentage ?? 0))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Probabilities Distribution */}
      {result.probabilities && (
        <div className={cn(panelStyles, 'flex flex-col gap-3 p-4')}>
          <div className="flex items-center justify-between">
            <p className="label-mono text-[10px]">Crop vs Weed Softmax Distribution</p>
            <span className="font-mono text-xs text-muted-foreground">
              Inference: {result.inferenceMs ? `${Math.round(result.inferenceMs)} ms` : '—'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <span className="size-2 rounded-full bg-primary" />
                  Crop
                </span>
                <span className="font-mono text-primary font-semibold">{(cropProb * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, cropProb * 100))}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Weed
                </span>
                <span className="font-mono text-amber-500 font-semibold">{(weedProb * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-amber-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, weedProb * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-Leaf Breakdown Table */}
      {hasLeaves && (
        <div className={cn(panelStyles, 'overflow-hidden')}>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="label-mono">Individual Leaf Instances &amp; Color Masks</p>
            <span className="font-mono text-xs text-muted-foreground">
              {result.leaves?.length} {result.leaves?.length === 1 ? 'leaf' : 'leaves'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-border bg-secondary/30 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Leaf</th>
                  <th className="px-4 py-2.5">Color Mask</th>
                  <th className="px-4 py-2.5">Surface Area</th>
                  <th className="px-4 py-2.5">% of Canopy</th>
                  <th className="px-4 py-2.5">Damage Area %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {result.leaves?.map((leaf) => (
                  <tr key={leaf.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-foreground">
                      Leaf #{leaf.id}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full border border-border"
                          style={{ backgroundColor: leaf.color }}
                        />
                        <span className="text-muted-foreground">{leaf.colorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-foreground">
                      {leaf.areaPixels.toLocaleString()} px
                    </td>
                    <td className="px-4 py-2.5 text-primary">
                      {leaf.percentageOfCanopy}%
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          'font-semibold',
                          leaf.damagePercentage === 0
                            ? 'text-primary'
                            : leaf.damagePercentage < 5
                              ? 'text-amber-500'
                              : 'text-destructive',
                        )}
                      >
                        {leaf.damagePercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onDownload} disabled={downloading} className={cn(buttonStyles.accent)}>
          {downloading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
          Download Colored Mask Image
        </button>
        {result.damageOverlayImage && (
          <button type="button" onClick={downloadDamageHeatmap} className={cn(buttonStyles.ghost)}>
            <Flame className="size-4 text-destructive" aria-hidden="true" />
            Download Damage Heatmap
          </button>
        )}
        <button type="button" onClick={downloadJson} className={cn(buttonStyles.ghost)}>
          <FileJson className="size-4" aria-hidden="true" />
          Export Phenotyping JSON
        </button>
      </div>
    </div>
  )
}

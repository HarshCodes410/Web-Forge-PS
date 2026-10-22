'use client'

import { Clock, History, Layers, Sparkles, Trash2, X } from 'lucide-react'
import type { ImageHistoryItem } from '@/lib/history'
import { formatBytes } from '@/lib/api'
import { formatTimeAgo } from '@/lib/history'
import { cn } from '@/lib/utils'

export function SidebarHistory({
  history,
  activeId,
  onSelect,
  onRemove,
  onClear,
  onLoadSample,
}: {
  history: ImageHistoryItem[]
  activeId: string | null
  onSelect: (item: ImageHistoryItem) => void
  onRemove: (id: string, e: React.MouseEvent) => void
  onClear: () => void
  onLoadSample: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="size-3.5 text-primary" aria-hidden="true" />
          <p className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Recent Scans
          </p>
          <span className="rounded-full bg-secondary px-1.5 py-0.2 font-mono text-[9px] font-semibold text-muted-foreground">
            {history.length}/5
          </span>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            title="Clear all recent scans"
            className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="size-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      {/* History Items List (Max 5) */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2.5 rounded-md border border-dashed border-border/80 bg-secondary/20 p-3.5 text-center">
          <Clock className="size-5 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-[11px] text-muted-foreground leading-snug">
            Last 5 analyzed images will appear here for quick access.
          </p>
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 rounded-sm border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="size-3" aria-hidden="true" />
            Try Sample Leaf
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2" role="list">
          {history.map((item) => {
            const isActive = activeId === item.id
            const result = item.result
            const isCrop = result?.prediction?.toLowerCase() === 'crop'
            const isWeed = result?.prediction?.toLowerCase() === 'weed'
            const isHealthy = (result?.damagePercentage ?? 0) < 5.0

            return (
              <li key={item.id} className="relative group">
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={cn(
                    'flex w-full items-start gap-2.5 rounded-md border p-2 text-left transition-all',
                    isActive
                      ? 'border-primary/80 bg-primary/10 shadow-sm'
                      : 'border-border/70 bg-card/60 hover:border-border hover:bg-secondary/40',
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative size-11 shrink-0 overflow-hidden rounded border border-border/80 bg-black">
                    {item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- data URL thumbnail
                      <img
                        src={item.thumbnailUrl}
                        alt={item.fileName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-secondary text-muted-foreground">
                        <Layers className="size-4" />
                      </div>
                    )}

                    {/* Tiny leaf count badge overlay */}
                    {result?.leafCount !== undefined && result?.leafCount !== null && (
                      <span className="absolute bottom-0 right-0 rounded-tl bg-black/85 px-1 py-0.2 font-mono text-[9px] font-bold text-primary">
                        {result.leafCount}L
                      </span>
                    )}
                  </div>

                  {/* Metadata & Labels */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          'truncate font-mono text-xs font-semibold',
                          isActive ? 'text-primary' : 'text-foreground',
                        )}
                        title={item.fileName}
                      >
                        {item.fileName}
                      </p>
                      {isActive && (
                        <span className="rounded-full bg-primary/20 px-1.5 py-0.2 font-mono text-[8px] uppercase tracking-wider text-primary shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Status / Results preview */}
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      {result ? (
                        <>
                          {result.prediction && (
                            <span
                              className={cn(
                                'font-mono text-[10px] font-medium',
                                isCrop ? 'text-primary' : isWeed ? 'text-amber-500' : 'text-muted-foreground',
                              )}
                            >
                              {result.prediction}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span
                            className={cn(
                              'font-mono text-[10px]',
                              isHealthy ? 'text-primary' : 'text-destructive',
                            )}
                          >
                            {isHealthy ? 'Healthy' : `${result.damagePercentage?.toFixed(0)}% dmg`}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          Ready to analyze
                        </span>
                      )}
                    </div>

                    {/* Timestamp & Size */}
                    <div className="mt-1 flex items-center justify-between font-mono text-[9px] text-muted-foreground/80">
                      <span>{formatTimeAgo(item.timestamp)}</span>
                      <span>{item.fileSize > 0 ? formatBytes(item.fileSize) : ''}</span>
                    </div>
                  </div>
                </button>

                {/* Remove single item button (visible on hover) */}
                <button
                  type="button"
                  onClick={(e) => onRemove(item.id, e)}
                  title="Remove from history"
                  className="absolute right-1 top-1 hidden size-5 items-center justify-center rounded bg-background/90 text-muted-foreground shadow-sm hover:text-destructive group-hover:flex"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

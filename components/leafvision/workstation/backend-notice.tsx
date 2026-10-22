import { CircleAlert, RefreshCw, ServerOff } from 'lucide-react'
import { API_URL } from '@/lib/api'
import type { BackendStatus } from '@/hooks/use-backend-health'
import { cn } from '@/lib/utils'

export function BackendNotice({
  status,
  onRecheck,
  isRechecking,
}: {
  status: BackendStatus
  onRecheck: () => void
  isRechecking: boolean
}) {
  if (status === 'not-configured') {
    return (
      <div role="status" className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4">
        <ServerOff className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
        <div className="flex flex-col gap-1 text-sm leading-relaxed">
          <p className="font-medium text-foreground">Model backend not connected</p>
          <p className="text-muted-foreground">
            Set <code className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">NEXT_PUBLIC_API_URL</code>{' '}
            to your FastAPI server URL (e.g. <span className="font-mono text-xs">https://your-backend.example.com</span>). No
            predictions will be shown until a real backend is connected.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'offline') {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-start">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
        <div className="flex flex-1 flex-col gap-1 text-sm leading-relaxed">
          <p className="font-medium text-foreground">Backend health check failed</p>
          <p className="text-muted-foreground">
            <span className="break-all font-mono text-xs text-foreground">{API_URL}/health</span> did not respond. The
            server may still be starting or may not expose a health route &mdash; you can still try classifying.
          </p>
        </div>
        <button
          type="button"
          onClick={onRecheck}
          className="inline-flex items-center gap-2 self-start rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground hover:bg-secondary"
        >
          <RefreshCw className={cn('size-3.5', isRechecking && 'animate-spin')} aria-hidden="true" />
          Retry
        </button>
      </div>
    )
  }

  return null
}

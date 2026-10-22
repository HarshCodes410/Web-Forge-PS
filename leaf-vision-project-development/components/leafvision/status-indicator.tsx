import { cn } from '@/lib/utils'
import type { BackendStatus } from '@/hooks/use-backend-health'

const STATUS_META: Record<BackendStatus, { label: string; dot: string; text: string }> = {
  online: { label: 'Online', dot: 'bg-accent', text: 'text-accent' },
  checking: { label: 'Checking', dot: 'bg-muted-foreground animate-pulse', text: 'text-muted-foreground' },
  offline: { label: 'Offline', dot: 'bg-destructive', text: 'text-destructive' },
  'not-configured': { label: 'Not set', dot: 'bg-destructive/70', text: 'text-destructive' },
}

export function StatusIndicator({ status, className }: { status: BackendStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span className={cn('inline-flex items-center gap-2 font-mono text-xs uppercase', meta.text, className)}>
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}

export function statusLabel(status: BackendStatus) {
  return STATUS_META[status].label
}

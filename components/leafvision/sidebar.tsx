'use client'

import { NAV_ITEMS } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { isApiConfigured } from '@/lib/api'
import type { BackendStatus } from '@/hooks/use-backend-health'
import type { ImageHistoryItem } from '@/lib/history'
import { StatusIndicator } from './status-indicator'
import { SidebarHistory } from './sidebar-history'

export type SidebarProps = {
  activeId: string
  status: BackendStatus
  history?: ImageHistoryItem[]
  activeHistoryId?: string | null
  onSelectHistory?: (item: ImageHistoryItem) => void
  onRemoveHistory?: (id: string, e: React.MouseEvent) => void
  onClearHistory?: () => void
  onLoadSample?: () => void
  onNavigate?: () => void
  className?: string
}

export function SidebarNav({ activeId, onNavigate }: { activeId: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={onNavigate}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-sm border-l-2 px-3 py-2 text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function SystemStatus({ status }: { status: BackendStatus }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="label-mono">System Status</p>
      <dl className="flex flex-col gap-2 font-mono text-xs">
        <div className="flex items-center justify-between">
          <dt className="text-foreground/80">API URL</dt>
          <dd
            className={cn(
              'inline-flex items-center gap-2 uppercase',
              isApiConfigured ? 'text-accent' : 'text-destructive',
            )}
          >
            <span
              aria-hidden="true"
              className={cn('size-1.5 rounded-full', isApiConfigured ? 'bg-accent' : 'bg-destructive')}
            />
            {isApiConfigured ? 'Set' : 'Missing'}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-foreground/80">Backend</dt>
          <dd>
            <StatusIndicator status={status} />
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-foreground/80">Frontend</dt>
          <dd>
            <StatusIndicator status="online" />
          </dd>
        </div>
      </dl>
    </div>
  )
}

export function Sidebar({
  activeId,
  status,
  history = [],
  activeHistoryId = null,
  onSelectHistory = () => {},
  onRemoveHistory = () => {},
  onClearHistory = () => {},
  onLoadSample = () => {},
  onNavigate,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-panel/95 lg:flex',
        className,
      )}
    >
      {/* Top: Navigation */}
      <div className="flex flex-col gap-4 px-5 pt-6 shrink-0">
        <p className="label-mono">Mission Control</p>
        <SidebarNav activeId={activeId} onNavigate={onNavigate} />
      </div>

      {/* Middle: History of Last 5 Images */}
      <div className="flex-1 overflow-y-auto px-5 py-4 border-t border-border/60">
        <SidebarHistory
          history={history}
          activeId={activeHistoryId}
          onSelect={onSelectHistory}
          onRemove={onRemoveHistory}
          onClear={onClearHistory}
          onLoadSample={onLoadSample}
        />
      </div>

      {/* Bottom: System Status */}
      <div className="border-t border-border px-5 py-4 shrink-0 bg-panel">
        <SystemStatus status={status} />
      </div>
    </aside>
  )
}

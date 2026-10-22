'use client'

import { NAV_ITEMS } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { isApiConfigured } from '@/lib/api'
import type { BackendStatus } from '@/hooks/use-backend-health'
import { StatusIndicator } from './status-indicator'

type SidebarProps = {
  activeId: string
  status: BackendStatus
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
                  'flex items-center gap-3 rounded-sm border-l-2 px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
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
      <dl className="flex flex-col gap-2.5 font-mono text-xs">
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

export function Sidebar({ activeId, status, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-border bg-panel/95 lg:flex',
        className,
      )}
    >
      <div className="flex flex-col gap-6 px-6 pt-7">
        <p className="label-mono">Mission Control</p>
        <SidebarNav activeId={activeId} />
      </div>
      <div className="border-t border-border px-6 py-6">
        <SystemStatus status={status} />
      </div>
    </aside>
  )
}

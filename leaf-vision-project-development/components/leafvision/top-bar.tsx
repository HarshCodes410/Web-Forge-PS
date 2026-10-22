'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import type { BackendStatus } from '@/hooks/use-backend-health'
import { SidebarNav, SystemStatus } from './sidebar'
import { StatusIndicator } from './status-indicator'

export function TopBar({ status, activeId }: { status: BackendStatus; activeId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <p className="font-mono text-sm tracking-[0.18em]">
            <span className="font-semibold text-foreground">LEAFVISION</span>
            <span className="px-2 text-primary">{'//'}</span>
            <span className="hidden text-accent sm:inline">INSTANCE SEGMENTATION</span>
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden text-right font-mono text-xs leading-relaxed md:block">
            <p className="font-semibold text-foreground">HACKATHON 2026</p>
            <p className="text-muted-foreground">
              Backend: <StatusIndicator status={status} className="text-xs" />
            </p>
          </div>
          <div className="hidden border-l border-border pl-6 font-mono text-xs leading-relaxed text-muted-foreground xl:block">
            <p>
              Model: <span className="text-foreground">Mask R-CNN</span>
            </p>
            <p>
              Backbone: <span className="text-foreground">ResNet-50 FPN</span>
            </p>
            <p>
              Endpoint: <span className="text-foreground">POST /predict</span>
            </p>
          </div>
          <div className="md:hidden">
            <StatusIndicator status={status} />
          </div>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="flex flex-col gap-6 border-t border-border bg-panel px-4 py-5 lg:hidden">
          <SidebarNav activeId={activeId} onNavigate={() => setOpen(false)} />
          <div className="border-t border-border pt-5">
            <SystemStatus status={status} />
          </div>
        </div>
      )}
    </header>
  )
}

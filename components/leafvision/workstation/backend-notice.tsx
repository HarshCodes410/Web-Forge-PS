'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Download, Laptop, RefreshCw, Server, Sparkles, Terminal } from 'lucide-react'
import { getEffectiveApiUrl, setCustomApiUrl } from '@/lib/api'
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
  const [showConfig, setShowConfig] = useState(false)
  const [urlInput, setUrlInput] = useState(() => getEffectiveApiUrl())
  const [savedMsg, setSavedMsg] = useState(false)

  function handleSaveUrl(e: React.FormEvent) {
    e.preventDefault()
    setCustomApiUrl(urlInput)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
    onRecheck()
  }

  function handleResetUrl() {
    setCustomApiUrl(null)
    setUrlInput('http://localhost:8000')
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
    onRecheck()
  }

  if (status === 'online') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-4 py-2.5 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="font-semibold text-primary">Local ResNet-50 Backend Connected</span>
          <span className="text-muted-foreground">({getEffectiveApiUrl()})</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" />
          <span>PyTorch GPU/CPU Engine Active</span>
        </div>
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="Backend Connection & Setup"
      className="flex flex-col gap-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5"
    >
      {/* Header Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-500">
            <Server className="size-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500">
                Local AI Engine: Offline
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.2 font-mono text-[10px] font-semibold text-primary">
                <Sparkles className="size-2.5" />
                In-Browser AI Fallback Ready
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You can analyze plants immediately using the built-in browser engine, or download &amp; run the Python ResNet-50 model locally.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="/downloads/leafvision-backend.zip"
            download="leafvision-backend.zip"
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/60 bg-primary/15 px-3 py-1.5 font-mono text-xs font-semibold text-primary hover:bg-primary/25 transition-colors shadow-sm"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Download Backend (ZIP)
          </a>
          <button
            type="button"
            onClick={onRecheck}
            disabled={isRechecking}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs text-foreground hover:bg-secondary transition-colors"
          >
            <RefreshCw className={cn('size-3.5', isRechecking && 'animate-spin')} aria-hidden="true" />
            {isRechecking ? 'Checking…' : 'Retry'}
          </button>
        </div>
      </div>

      {/* 3-Step Setup Instructions Card */}
      <div className="grid grid-cols-1 gap-2.5 rounded-md border border-border/60 bg-black/40 p-3 sm:grid-cols-3">
        <div className="flex items-start gap-2.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[10px] font-bold text-foreground">
            1
          </span>
          <div className="flex flex-col text-[11px]">
            <span className="font-semibold text-foreground">Download &amp; Unzip</span>
            <span className="text-muted-foreground">Click the button above to download the pre-packaged backend zip.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[10px] font-bold text-foreground">
            2
          </span>
          <div className="flex flex-col text-[11px]">
            <span className="font-semibold text-foreground">1-Click Launch</span>
            <span className="text-muted-foreground">
              Double-click <code className="text-primary font-mono">start.sh</code> (Mac/Linux) or <code className="text-primary font-mono">start.bat</code> (Windows).
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[10px] font-bold text-foreground">
            3
          </span>
          <div className="flex flex-col text-[11px]">
            <span className="font-semibold text-foreground">Auto-Connected!</span>
            <span className="text-muted-foreground">The server runs on port 8000. LeafVision automatically connects to it.</span>
          </div>
        </div>
      </div>

      {/* Advanced API URL Config Toggle */}
      <div className="border-t border-border/40 pt-2">
        <button
          type="button"
          onClick={() => setShowConfig((v) => !v)}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Terminal className="size-3" />
          <span>Advanced: Configure Custom Backend API URL</span>
          {showConfig ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>

        {showConfig && (
          <form onSubmit={handleSaveUrl} className="mt-2.5 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://localhost:8000"
              className="min-w-[240px] flex-1 rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
            <button
              type="submit"
              className="rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 font-mono text-xs font-medium text-primary hover:bg-primary/20"
            >
              Save &amp; Reconnect
            </button>
            <button
              type="button"
              onClick={handleResetUrl}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Default
            </button>
            {savedMsg && <span className="font-mono text-xs text-primary">Saved!</span>}
          </form>
        )}
      </div>
    </div>
  )
}

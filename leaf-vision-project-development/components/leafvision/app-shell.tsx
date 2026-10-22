'use client'

import { useEffect, useState } from 'react'
import { NAV_ITEMS } from '@/lib/nav'
import { useBackendHealth } from '@/hooks/use-backend-health'
import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'
import { Hero } from './hero'
import { SpecStrip } from './spec-strip'
import { Workstation } from './workstation/workstation'
import { Pipeline } from './pipeline'
import { ModelDetails } from './model-details'
import { Integration } from './integration'

export function AppShell() {
  const { status, recheck, isRechecking } = useBackendHealth()
  const [activeId, setActiveId] = useState(NAV_ITEMS[0].id)

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -60% 0px' },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative min-h-dvh bg-grid">
      <Sidebar activeId={activeId} status={status} />
      <div className="lg:pl-64">
        <TopBar status={status} activeId={activeId} />
        <main className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-4">
            <Hero />
            <SpecStrip />
          </div>
          <Workstation status={status} onRecheck={recheck} isRechecking={isRechecking} />
          <Pipeline />
          <ModelDetails />
          <Integration />
        </main>
        <footer className="border-t border-border px-4 py-6 sm:px-6 lg:px-8">
          <p className="font-mono text-xs text-muted-foreground">
            LeafVision &middot; Leaf instance segmentation with Mask R-CNN &middot; Hackathon 2026
          </p>
        </footer>
      </div>
    </div>
  )
}

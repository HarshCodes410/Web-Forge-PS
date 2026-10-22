import { cn } from '@/lib/utils'
import { panelStyles } from '@/lib/styles'

export function PanelFrame({
  title,
  tag,
  tagTone = 'muted',
  children,
  footer,
}: {
  title: string
  tag?: string
  tagTone?: 'muted' | 'primary' | 'accent' | 'destructive'
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const toneClass = {
    muted: 'border-border text-muted-foreground',
    primary: 'border-primary/40 text-primary',
    accent: 'border-accent/40 text-accent',
    destructive: 'border-destructive/40 text-destructive',
  }[tagTone]

  return (
    <section className={cn(panelStyles, 'flex flex-col')} aria-label={title}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="label-mono text-foreground/90">{title}</h3>
        {tag && (
          <span className={cn('rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]', toneClass)}>
            {tag}
          </span>
        )}
      </header>
      <div className="flex-1 p-4">{children}</div>
      {footer && <footer className="border-t border-border px-4 py-3">{footer}</footer>}
    </section>
  )
}

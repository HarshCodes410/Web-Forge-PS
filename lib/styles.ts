import { cn } from '@/lib/utils'

const base =
  'inline-flex items-center justify-center gap-3 rounded-md border px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40'

export const buttonStyles = {
  primary: cn(base, 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'),
  accent: cn(base, 'border-accent/40 bg-accent/5 text-accent hover:bg-accent/10'),
  ghost: cn(base, 'border-border bg-card/60 text-foreground hover:bg-secondary'),
}

export const panelStyles = 'rounded-lg border border-border bg-card/70 backdrop-blur-sm'

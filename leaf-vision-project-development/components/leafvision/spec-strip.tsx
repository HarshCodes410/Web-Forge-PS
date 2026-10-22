import { panelStyles } from '@/lib/styles'
import { cn } from '@/lib/utils'

const SPECS = [
  { label: 'Architecture', value: 'Mask R-CNN' },
  { label: 'Backbone', value: 'ResNet-50 FPN' },
  { label: 'Task', value: 'Instance Seg.' },
  { label: 'Target Class', value: 'Leaf' },
  { label: 'Output', value: 'Masks + Boxes' },
  { label: 'Endpoint', value: '/predict', highlight: true },
]

export function SpecStrip() {
  return (
    <ul aria-label="System specifications" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 xl:gap-4">
      {SPECS.map((spec) => (
        <li key={spec.label} className={cn(panelStyles, 'flex min-h-28 flex-col justify-between gap-4 p-4')}>
          <p className="label-mono text-[10px]">{spec.label}</p>
          <p className={cn('text-xl font-medium leading-tight', spec.highlight ? 'font-mono text-primary' : 'text-foreground')}>
            {spec.value}
          </p>
        </li>
      ))}
    </ul>
  )
}

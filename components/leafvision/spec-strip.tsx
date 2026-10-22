import { panelStyles } from '@/lib/styles'
import { cn } from '@/lib/utils'

const SPECS = [
  { label: 'Leaf Counting', value: 'Per-Plant Count' },
  { label: 'Instance Masks', value: '12-Color Palette' },
  { label: 'Surface Area', value: 'Canopy & Leaf Area' },
  { label: 'Health Screening', value: 'Damage & Lesions' },
  { label: 'Classification', value: 'Crop vs Weed' },
  { label: 'Serving', value: 'FastAPI /predict', highlight: true },
]

export function SpecStrip() {
  return (
    <ul aria-label="System specifications" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 xl:gap-4">
      {SPECS.map((spec) => (
        <li key={spec.label} className={cn(panelStyles, 'flex min-h-28 flex-col justify-between gap-4 p-4')}>
          <p className="label-mono text-[10px]">{spec.label}</p>
          <p className={cn('text-lg font-medium leading-tight', spec.highlight ? 'font-mono text-primary' : 'text-foreground')}>
            {spec.value}
          </p>
        </li>
      ))}
    </ul>
  )
}

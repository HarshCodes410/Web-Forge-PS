import { ArrowRight } from 'lucide-react'
import { panelStyles } from '@/lib/styles'
import { cn } from '@/lib/utils'
import { SectionHeader } from './section-header'

const STEPS = [
  { code: 'IN', title: 'Image Upload', body: 'Plant image is validated in the browser and sent as multipart form data.' },
  { code: 'PRE', title: 'Preprocessing', body: 'The backend resizes to 224×224 and applies ImageNet standard RGB normalization.' },
  { code: 'RES', title: 'ResNet-50 Backbone', body: 'Deep convolutional residual bottleneck blocks extract high-level feature representations.' },
  { code: 'HEAD', title: 'Dense Projection', body: 'A 256-unit layer with 40% dropout mitigates overfitting on agricultural foliage.' },
  { code: 'OUT', title: 'Softmax & Probabilities', body: 'Two-class output layer calculates calibrated confidence for Crop vs Weed.' },
]

export function Pipeline() {
  return (
    <section id="pipeline" aria-labelledby="pipeline-title" className="flex scroll-mt-24 flex-col gap-6">
      <SectionHeader
        id="pipeline-title"
        eyebrow="02 / Pipeline"
        title="From pixels to crop identification"
        description="What happens between pressing Classify Plant and seeing the result."
      />
      <ol className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {STEPS.map((step, i) => (
          <li key={step.code} className={cn(panelStyles, 'relative flex flex-col gap-4 p-5')}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, '0')}</span>
              <span className="rounded-sm border border-accent/30 px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-accent">
                {step.code}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight
                aria-hidden="true"
                className="absolute -right-3 top-1/2 z-10 hidden size-4 -translate-y-1/2 text-muted-foreground md:block"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

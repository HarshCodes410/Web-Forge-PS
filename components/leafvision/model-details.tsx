import { panelStyles } from '@/lib/styles'
import { cn } from '@/lib/utils'
import { SectionHeader } from './section-header'

const ROWS = [
  ['Architecture', 'ResNet-50 (50-layer Deep Residual Network)'],
  ['Weights', 'resnet50_phenobench.pth (92 MB PyTorch state dict)'],
  ['Classification Head', 'Linear(2048 → 256) → ReLU → Dropout(0.4) → Linear(256 → 2)'],
  ['Target Classes', 'Crop (Class 0), Weed (Class 1)'],
  ['Pre-trained Base', 'ImageNet (ResNet50_Weights.DEFAULT)'],
  ['Serving', 'FastAPI · POST /predict (multipart “file”)'],
  ['Deployment', 'Next.js on Vercel · FastAPI backend (Local / Cloud)'],
]

const USES = [
  { title: 'Precision Herbicide Spraying', body: 'Target specific weed patches rather than broadcast spraying, saving costs and chemicals.' },
  { title: 'Automated Crop Phenotyping', body: 'Benchmark crop growth and canopy development across field rows.' },
  { title: 'Field Rover Robotics', body: 'Low-latency classification optimized for real-time edge agricultural vehicles.' },
]

export function ModelDetails() {
  return (
    <section id="model" aria-labelledby="model-title" className="flex scroll-mt-24 flex-col gap-6">
      <SectionHeader
        id="model-title"
        eyebrow="03 / Model Details"
        title="ResNet-50 for PhenoBench"
        description="A residual neural network fine-tuned on the PhenoBench dataset to distinguish agricultural crops from invasive weeds."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <dl className={cn(panelStyles, 'divide-y divide-border lg:col-span-3')}>
          {ROWS.map(([term, detail]) => (
            <div key={term} className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-3 sm:gap-4">
              <dt className="label-mono pt-0.5">{term}</dt>
              <dd className="text-sm text-foreground sm:col-span-2">{detail}</dd>
            </div>
          ))}
        </dl>
        <ul className="flex flex-col gap-3 lg:col-span-2">
          {USES.map((use) => (
            <li key={use.title} className={cn(panelStyles, 'flex flex-col gap-1.5 border-l-2 border-l-primary p-5')}>
              <h3 className="font-semibold text-foreground">{use.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{use.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

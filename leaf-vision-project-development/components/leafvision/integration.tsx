import { API_URL, isApiConfigured } from '@/lib/api'
import { panelStyles } from '@/lib/styles'
import { cn } from '@/lib/utils'
import { SectionHeader } from './section-header'

const REQUEST = `curl -X POST "$NEXT_PUBLIC_API_URL/predict" \\
  -F "file=@plant.jpg"`

const RESPONSE = `{
  "result_image": "<base64 PNG or URL>",
  "leaf_count": 12,
  "inference_ms": 840,
  "instances": [
    { "id": 1, "score": 0.98, "label": "leaf" }
  ]
}`

export function Integration() {
  return (
    <section id="integration" aria-labelledby="integration-title" className="flex scroll-mt-24 flex-col gap-6">
      <SectionHeader
        id="integration-title"
        eyebrow="04 / API Integration"
        title="Backend contract"
        description="The frontend talks directly to your FastAPI server. Responses can be a raw image (image/png, image/jpeg) or JSON in the shape below."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CodeBlock title="Request" code={REQUEST} />
        <CodeBlock title="JSON Response" code={RESPONSE} />
      </div>
      <div className={cn(panelStyles, 'flex flex-col gap-3 p-5 font-mono text-xs sm:flex-row sm:items-center sm:justify-between')}>
        <span className="text-muted-foreground">NEXT_PUBLIC_API_URL</span>
        <span className={cn('break-all', isApiConfigured ? 'text-accent' : 'text-destructive')}>
          {isApiConfigured ? API_URL : 'Not configured'}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Remember to enable CORS on the backend for this site&apos;s origin. Optional: expose <code className="font-mono text-foreground">GET /health</code>{' '}
        so the status indicators can report availability.
      </p>
    </section>
  )
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <figure className={cn(panelStyles, 'overflow-hidden')}>
      <figcaption className="label-mono border-b border-border px-4 py-3">{title}</figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
    </figure>
  )
}

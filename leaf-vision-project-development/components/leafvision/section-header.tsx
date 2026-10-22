export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="label-mono text-primary">{eyebrow}</p>
      <h2 id={id} className="text-balance text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      {description && <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  )
}

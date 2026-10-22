import Image from 'next/image'
import { UploadCloud, Workflow, Layers } from 'lucide-react'
import { buttonStyles } from '@/lib/styles'

export function Hero() {
  return (
    <section
      id="overview"
      aria-labelledby="hero-title"
      className="relative scroll-mt-24 overflow-hidden rounded-lg border border-border bg-black"
    >
      <Image
        src="/images/hero-leaves.png"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 80vw, 100vw"
        className="object-cover object-right opacity-70"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/10" />

      <div className="relative flex flex-col gap-8 px-6 py-14 sm:px-12 sm:py-16 lg:py-20">
        <h1
          id="hero-title"
          className="max-w-3xl text-balance text-4xl font-bold uppercase leading-[1.02] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
        >
          Every leaf, <span className="text-primary">counted</span> and outlined.
        </h1>
        <p className="max-w-2xl border-l-2 border-primary pl-4 text-pretty text-lg leading-relaxed text-foreground/80">
          LeafVision uses a Mask R-CNN instance segmentation model to detect and mask each individual leaf in a plant
          image &mdash; enabling automated leaf counting and plant phenotyping.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href="#workstation" className={buttonStyles.primary}>
            <UploadCloud className="size-4" aria-hidden="true" />
            Upload Plant Image
          </a>
          <a href="#pipeline" className={buttonStyles.accent}>
            <Workflow className="size-4" aria-hidden="true" />
            View Pipeline
          </a>
          <a href="#model" className={buttonStyles.ghost}>
            <Layers className="size-4" aria-hidden="true" />
            Model Details
          </a>
        </div>
      </div>
    </section>
  )
}

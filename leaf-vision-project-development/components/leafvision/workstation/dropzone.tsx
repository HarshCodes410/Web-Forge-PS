'use client'

import { useRef, useState } from 'react'
import { ImageUp } from 'lucide-react'
import { ACCEPTED_TYPES } from '@/lib/api'
import { cn } from '@/lib/utils'

export function Dropzone({ onFile, disabled }: { onFile: (file: File) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file && !disabled) onFile(file)
      }}
      className={cn(
        'relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 rounded-md border border-dashed p-6 text-center transition-colors',
        dragging ? 'border-primary bg-primary/10' : 'border-border bg-background/40 hover:border-primary/50',
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
        <ImageUp className="size-6" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-foreground">Drag & drop a plant image</p>
        <p className="text-sm text-muted-foreground">JPG, PNG, or WebP &middot; up to 10 MB</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="rounded-md border border-border bg-card px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Browse Files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="sr-only"
        aria-label="Upload plant image"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

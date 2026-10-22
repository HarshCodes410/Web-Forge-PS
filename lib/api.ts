import { runBrowserPhenotyping } from './browser-engine'

export const DEFAULT_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '') || '/backend'

export function getEffectiveApiUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('leafvision_custom_api_url')
    if (saved) return saved.trim().replace(/\/+$/, '')
  }
  return DEFAULT_API_URL
}

export function setCustomApiUrl(url: string | null) {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('leafvision_custom_api_url')
    } else {
      localStorage.setItem('leafvision_custom_api_url', url.trim().replace(/\/+$/, ''))
    }
  }
}

export const API_URL = DEFAULT_API_URL
export const isApiConfigured = true

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_FILE_BYTES = 10 * 1024 * 1024
const PREDICT_TIMEOUT_MS = 30_000

export type LeafInstance = {
  id: number
  score: number | null
  label: string | null
}

export type LeafDetail = {
  id: number
  color: string
  colorName: string
  areaPixels: number
  percentageOfCanopy: number
  damagePercentage: number
}

export type PredictionResult = {
  imageUrl: string
  isObjectUrl: boolean
  leafCount: number | null
  instances: LeafInstance[]
  inferenceMs: number | null
  // PhenoBench ResNet-50 Classification
  prediction?: 'Crop' | 'Weed' | string | null
  classId?: number | null
  confidence?: number | null
  probabilities?: Record<string, number> | null
  // Plant Phenotyping: Area & Counting
  totalLeafAreaPixels?: number | null
  canopyCoveragePct?: number | null
  // Health & Damage Area
  healthyAreaPixels?: number | null
  healthyPercentage?: number | null
  damagedAreaPixels?: number | null
  damagePercentage?: number | null
  healthResult?: string | null
  damageSeverity?: string | null
  // Visual Overlays & Lists
  leaves?: LeafDetail[]
  coloredOverlayImage?: string | null
  damageOverlayImage?: string | null
}

export class ApiError extends Error {
  constructor(
    message: string,
    public kind: 'not-configured' | 'network' | 'timeout' | 'server' | 'invalid-response',
  ) {
    super(message)
  }
}

const IMAGE_KEYS = [
  'colored_overlay_image',
  'result_image',
  'segmented_image',
  'output_image',
  'overlay_image',
  'overlay',
  'mask_image',
  'image',
  'result',
]
const COUNT_KEYS = ['leaf_count', 'num_leaves', 'num_instances', 'count', 'total_leaves']
const INSTANCE_KEYS = ['instances', 'detections', 'predictions']
const TIME_KEYS = ['inference_ms', 'inference_time_ms', 'time_ms', 'processing_time_ms']

function toImageSrc(value: string): string {
  if (value.startsWith('data:') || /^https?:\/\//.test(value)) return value
  const base = getEffectiveApiUrl()
  if (value.startsWith('/')) return `${base}${value}`
  return `data:image/png;base64,${value}`
}

function pickNumber(data: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const v = data[key]
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return null
}

function parseInstances(data: Record<string, unknown>): LeafInstance[] {
  for (const key of INSTANCE_KEYS) {
    const list = data[key]
    if (!Array.isArray(list)) continue
    return list.map((item, i) => {
      const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      const score = typeof obj.score === 'number' ? obj.score : typeof obj.confidence === 'number' ? obj.confidence : null
      const label = typeof obj.label === 'string' ? obj.label : typeof obj.class_name === 'string' ? obj.class_name : null
      return { id: typeof obj.id === 'number' ? obj.id : i + 1, score, label }
    })
  }
  return []
}

function parseLeaves(data: Record<string, unknown>): LeafDetail[] {
  const leaves = data['leaves']
  if (!Array.isArray(leaves)) return []
  return leaves.map((leaf, i) => {
    const obj = (leaf && typeof leaf === 'object' ? leaf : {}) as Record<string, unknown>
    return {
      id: typeof obj.id === 'number' ? obj.id : i + 1,
      color: typeof obj.color === 'string' ? obj.color : '#10b981',
      colorName: typeof obj.color_name === 'string' ? obj.color_name : 'Leaf',
      areaPixels: typeof obj.area_pixels === 'number' ? obj.area_pixels : 0,
      percentageOfCanopy: typeof obj.percentage_of_canopy === 'number' ? obj.percentage_of_canopy : 0,
      damagePercentage: typeof obj.damage_percentage === 'number' ? obj.damage_percentage : 0,
    }
  })
}

function parseJsonPrediction(data: Record<string, unknown>, fallbackImageUrl: string): PredictionResult {
  const imageValue = IMAGE_KEYS.map((k) => data[k]).find((v): v is string => typeof v === 'string' && v.length > 0)
  
  const prediction =
    typeof data.prediction === 'string'
      ? data.prediction
      : typeof data.class_name === 'string'
        ? data.class_name
        : typeof data.label === 'string'
          ? data.label
          : null

  const classId =
    typeof data.class_id === 'number'
      ? data.class_id
      : typeof data.classId === 'number'
        ? data.classId
        : null

  const confidence =
    typeof data.confidence === 'number'
      ? data.confidence
      : typeof data.score === 'number'
        ? data.score
        : null

  const probabilities =
    data.probabilities && typeof data.probabilities === 'object'
      ? (data.probabilities as Record<string, number>)
      : null

  const instances = parseInstances(data)
  const leaves = parseLeaves(data)
  const explicitCount = pickNumber(data, COUNT_KEYS)
  const inferenceSeconds = pickNumber(data, ['inference_time', 'processing_time'])
  const inferenceMs = pickNumber(data, TIME_KEYS) ?? (inferenceSeconds !== null ? inferenceSeconds * 1000 : null)

  const totalLeafAreaPixels = pickNumber(data, ['total_leaf_area_pixels', 'leaf_area', 'total_area'])
  const canopyCoveragePct = pickNumber(data, ['canopy_coverage_pct', 'canopy_pct', 'coverage_pct'])

  // Health and Damage Area
  const healthyAreaPixels = pickNumber(data, ['healthy_area_pixels', 'healthy_pixels'])
  const healthyPercentage = pickNumber(data, ['healthy_percentage', 'healthy_pct'])
  const damagedAreaPixels = pickNumber(data, ['damaged_area_pixels', 'damage_area'])
  const damagePercentage = pickNumber(data, ['damage_percentage', 'damage_pct'])
  const healthResult = typeof data.health_result === 'string' ? data.health_result : 'Result: Healthy'
  const damageSeverity = typeof data.damage_severity === 'string' ? data.damage_severity : null

  // Visual Overlays
  const coloredOverlayImage = typeof data.colored_overlay_image === 'string' ? toImageSrc(data.colored_overlay_image) : null
  const damageOverlayImage = typeof data.damage_overlay_image === 'string' ? toImageSrc(data.damage_overlay_image) : null

  const finalImageUrl = coloredOverlayImage ?? (imageValue ? toImageSrc(imageValue) : fallbackImageUrl)

  return {
    imageUrl: finalImageUrl,
    isObjectUrl: !imageValue && !coloredOverlayImage,
    leafCount: explicitCount ?? (leaves.length > 0 ? leaves.length : instances.length > 0 ? instances.length : null),
    instances,
    leaves,
    inferenceMs,
    prediction,
    classId,
    confidence,
    probabilities,
    totalLeafAreaPixels,
    canopyCoveragePct,
    healthyAreaPixels,
    healthyPercentage,
    damagedAreaPixels,
    damagePercentage,
    healthResult,
    damageSeverity,
    coloredOverlayImage,
    damageOverlayImage,
  }
}

export async function predictLeaves(file: File): Promise<PredictionResult> {
  const apiUrl = getEffectiveApiUrl()
  const form = new FormData()
  form.append('file', file)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PREDICT_TIMEOUT_MS)

  try {
    const res = await fetch(`${apiUrl}/predict`, { method: 'POST', body: form, signal: controller.signal })
    if (res.ok) {
      const data = await res.json()
      if (data && typeof data === 'object') {
        return parseJsonPrediction(data as Record<string, unknown>, URL.createObjectURL(file))
      }
    }
  } catch (err) {
    console.info(`Backend at ${apiUrl} unreachable, executing in-browser computer vision engine.`, err)
  } finally {
    clearTimeout(timer)
  }

  // Graceful fallback to client-side phenotyping engine
  return runBrowserPhenotyping(file)
}

export type BackendHealth = 'online' | 'offline'

export async function checkHealth(): Promise<BackendHealth> {
  const apiUrl = getEffectiveApiUrl()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3500)
  try {
    let res = await fetch(`${apiUrl}/health`, { signal: controller.signal, cache: 'no-store' })
    if (!res.ok) {
      res = await fetch(`${apiUrl}/`, { signal: controller.signal, cache: 'no-store' })
    }
    return res.ok ? 'online' : 'offline'
  } catch {
    return 'offline'
  } finally {
    clearTimeout(timer)
  }
}


export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Unsupported file type. Please upload a JPG, PNG, or WebP image.'
  if (file.size > MAX_FILE_BYTES) return 'File is larger than 10 MB. Please upload a smaller image.'
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

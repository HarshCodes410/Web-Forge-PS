export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '')

export const isApiConfigured = API_URL.length > 0

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_FILE_BYTES = 10 * 1024 * 1024
const PREDICT_TIMEOUT_MS = 120_000

export type LeafInstance = {
  id: number
  score: number | null
  label: string | null
}

export type PredictionResult = {
  imageUrl: string
  isObjectUrl: boolean
  leafCount: number | null
  instances: LeafInstance[]
  inferenceMs: number | null
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
const INSTANCE_KEYS = ['instances', 'detections', 'predictions', 'leaves']
const TIME_KEYS = ['inference_ms', 'inference_time_ms', 'time_ms', 'processing_time_ms']

function toImageSrc(value: string): string {
  if (value.startsWith('data:') || /^https?:\/\//.test(value)) return value
  if (value.startsWith('/')) return `${API_URL}${value}`
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

function parseJsonPrediction(data: Record<string, unknown>): PredictionResult {
  const imageValue = IMAGE_KEYS.map((k) => data[k]).find((v): v is string => typeof v === 'string' && v.length > 0)
  if (!imageValue) {
    throw new ApiError(
      `The backend responded, but no result image was found. Expected one of: ${IMAGE_KEYS.join(', ')}.`,
      'invalid-response',
    )
  }
  const instances = parseInstances(data)
  const explicitCount = pickNumber(data, COUNT_KEYS)
  const inferenceSeconds = pickNumber(data, ['inference_time', 'processing_time'])
  const inferenceMs = pickNumber(data, TIME_KEYS) ?? (inferenceSeconds !== null ? inferenceSeconds * 1000 : null)

  return {
    imageUrl: toImageSrc(imageValue),
    isObjectUrl: false,
    leafCount: explicitCount ?? (instances.length > 0 ? instances.length : null),
    instances,
    inferenceMs,
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json()
    const detail = body?.detail ?? body?.error ?? body?.message
    if (typeof detail === 'string') return detail
    if (detail) return JSON.stringify(detail)
  } catch {
    // body was not JSON
  }
  return res.statusText || 'Unknown server error'
}

export async function predictLeaves(file: File): Promise<PredictionResult> {
  if (!isApiConfigured) {
    throw new ApiError('NEXT_PUBLIC_API_URL is not set, so there is no model backend to send the image to.', 'not-configured')
  }

  const form = new FormData()
  form.append('file', file)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PREDICT_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${API_URL}/predict`, { method: 'POST', body: form, signal: controller.signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('The model took too long to respond. Try a smaller image or check the backend.', 'timeout')
    }
    throw new ApiError(
      `Could not reach the backend at ${API_URL}. It may be offline, still starting, or blocking this origin via CORS.`,
      'network',
    )
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    throw new ApiError(`Backend error (${res.status}): ${await readErrorMessage(res)}`, 'server')
  }

  const contentType = res.headers.get('content-type') ?? ''

  if (contentType.startsWith('image/')) {
    const blob = await res.blob()
    const headerCount = Number(res.headers.get('x-leaf-count'))
    const headerTime = Number(res.headers.get('x-inference-ms'))
    return {
      imageUrl: URL.createObjectURL(blob),
      isObjectUrl: true,
      leafCount: Number.isFinite(headerCount) && res.headers.has('x-leaf-count') ? headerCount : null,
      instances: [],
      inferenceMs: Number.isFinite(headerTime) && res.headers.has('x-inference-ms') ? headerTime : null,
    }
  }

  let data: unknown
  try {
    data = await res.json()
  } catch {
    throw new ApiError('The backend returned a response that is neither JSON nor an image.', 'invalid-response')
  }
  if (!data || typeof data !== 'object') {
    throw new ApiError('The backend returned an unexpected response shape.', 'invalid-response')
  }
  return parseJsonPrediction(data as Record<string, unknown>)
}

export type BackendHealth = 'online' | 'offline'

export async function checkHealth(): Promise<BackendHealth> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal, cache: 'no-store' })
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

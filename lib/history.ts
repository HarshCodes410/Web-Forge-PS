import type { PredictionResult } from './api'

export type ImageHistoryItem = {
  id: string
  fileName: string
  fileSize: number
  thumbnailUrl: string // Base64 data URL for instant rendering & persistence
  timestamp: number // unix ms
  timeFormatted: string
  result?: PredictionResult | null
}

export const MAX_HISTORY = 5
const STORAGE_KEY = 'leafvision_history_v1'

export async function createOptimizedThumbnail(file: File, maxDim = 320): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('')
      return
    }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        const canvas = document.createElement('canvas')
        let w = img.naturalWidth || img.width
        let h = img.naturalHeight || img.height

        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w)
            w = maxDim
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h)
            h = maxDim
          }
        }

        canvas.width = Math.max(1, w)
        canvas.height = Math.max(1, h)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.82))
        } else {
          resolve('')
        }
      } catch {
        resolve('')
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve('')
    }
    img.src = url
  })
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 10) return 'Just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function saveHistoryToStorage(items: ImageHistoryItem[]): void {
  if (typeof window === 'undefined') return
  try {
    // Only persist thumbnail, result metadata, and basic info to fit cleanly within quota
    const stripped = items.slice(0, MAX_HISTORY).map((item) => ({
      id: item.id,
      fileName: item.fileName,
      fileSize: item.fileSize,
      thumbnailUrl: item.thumbnailUrl,
      timestamp: item.timestamp,
      timeFormatted: item.timeFormatted,
      result: item.result
        ? {
            // Keep critical display metrics, strip heavy base64 strings if too large
            prediction: item.result.prediction,
            confidence: item.result.confidence,
            leafCount: item.result.leafCount,
            totalLeafAreaPixels: item.result.totalLeafAreaPixels,
            canopyCoveragePct: item.result.canopyCoveragePct,
            damagePercentage: item.result.damagePercentage,
            healthyPercentage: item.result.healthyPercentage,
            healthResult: item.result.healthResult,
            damageSeverity: item.result.damageSeverity,
            imageUrl: item.result.imageUrl?.startsWith('data:') ? '' : item.result.imageUrl,
            coloredOverlayImage: item.result.coloredOverlayImage?.startsWith('data:')
              ? item.thumbnailUrl
              : item.result.coloredOverlayImage,
            leaves: item.result.leaves,
          }
        : null,
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped))
  } catch (e) {
    console.warn('Could not save history to localStorage:', e)
  }
}

export function loadHistoryFromStorage(): ImageHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX_HISTORY).map((item) => ({
      id: String(item.id || Date.now()),
      fileName: String(item.fileName || 'scan.jpg'),
      fileSize: Number(item.fileSize || 0),
      thumbnailUrl: String(item.thumbnailUrl || ''),
      timestamp: Number(item.timestamp || Date.now()),
      timeFormatted: String(item.timeFormatted || 'Recent'),
      result: item.result || null,
    }))
  } catch {
    return []
  }
}

export async function fileFromDataUrl(dataUrl: string, fileName: string): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' })
}

export async function loadDemoSampleFile(): Promise<File> {
  const res = await fetch('/images/hero-leaves.png')
  const blob = await res.blob()
  return new File([blob], 'hero-leaves.png', { type: 'image/png' })
}

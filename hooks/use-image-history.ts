'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PredictionResult } from '@/lib/api'
import {
  createOptimizedThumbnail,
  fileFromDataUrl,
  loadDemoSampleFile,
  loadHistoryFromStorage,
  saveHistoryToStorage,
  type ImageHistoryItem,
  MAX_HISTORY,
} from '@/lib/history'

export function useImageHistory() {
  const [history, setHistory] = useState<ImageHistoryItem[]>([])
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)
  const fileCacheRef = useRef<Map<string, File>>(new Map())
  const isInitialized = useRef(false)

  // Load from localStorage on client mount
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true
    const saved = loadHistoryFromStorage()
    if (saved.length > 0) {
      setHistory(saved)
    }
  }, [])

  // Sync to localStorage whenever history changes
  useEffect(() => {
    if (!isInitialized.current) return
    saveHistoryToStorage(history)
  }, [history])

  // Register a newly selected image
  const registerImage = useCallback(async (file: File): Promise<string> => {
    const id = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    fileCacheRef.current.set(id, file)

    const thumbnail = await createOptimizedThumbnail(file)

    const now = new Date()
    const newItem: ImageHistoryItem = {
      id,
      fileName: file.name,
      fileSize: file.size,
      thumbnailUrl: thumbnail,
      timestamp: Date.now(),
      timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      result: null,
    }

    setHistory((prev) => {
      // Avoid duplicate file names at the top; place latest first, max 5 items
      const filtered = prev.filter((item) => item.fileName !== file.name)
      return [newItem, ...filtered].slice(0, MAX_HISTORY)
    })
    setActiveHistoryId(id)

    return id
  }, [])

  // Attach phenotyping results to an image history entry
  const attachResult = useCallback((id: string, result: PredictionResult) => {
    setHistory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          result,
          // If colored overlay image exists and thumbnail was empty, update thumbnail
          thumbnailUrl: item.thumbnailUrl || result.coloredOverlayImage || result.imageUrl,
        }
      }),
    )
  }, [])

  // Retrieve File for an item (from memory or reconstructed from thumbnail)
  const getFileForItem = useCallback(async (item: ImageHistoryItem): Promise<File> => {
    const cached = fileCacheRef.current.get(item.id)
    if (cached) return cached
    if (item.thumbnailUrl) {
      try {
        const file = await fileFromDataUrl(item.thumbnailUrl, item.fileName)
        fileCacheRef.current.set(item.id, file)
        return file
      } catch (e) {
        console.warn('Could not reconstruct file from thumbnail', e)
      }
    }
    // Fallback to sample if everything else fails
    return loadDemoSampleFile()
  }, [])

  // Remove a single history item
  const removeHistoryItem = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    fileCacheRef.current.delete(id)
    setHistory((prev) => prev.filter((item) => item.id !== id))
    setActiveHistoryId((current) => (current === id ? null : current))
  }, [])

  // Clear all history items
  const clearHistory = useCallback(() => {
    fileCacheRef.current.clear()
    setHistory([])
    setActiveHistoryId(null)
  }, [])

  return {
    history,
    activeHistoryId,
    setActiveHistoryId,
    registerImage,
    attachResult,
    getFileForItem,
    removeHistoryItem,
    clearHistory,
  }
}

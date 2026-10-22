'use client'

import useSWR from 'swr'
import { checkHealth, isApiConfigured } from '@/lib/api'

export type BackendStatus = 'not-configured' | 'checking' | 'online' | 'offline'

export function useBackendHealth() {
  const { data, isLoading, mutate, isValidating } = useSWR(isApiConfigured ? 'backend-health' : null, checkHealth, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  })

  let status: BackendStatus
  if (!isApiConfigured) status = 'not-configured'
  else if (isLoading || !data) status = 'checking'
  else status = data

  return { status, recheck: () => mutate(), isRechecking: isValidating }
}

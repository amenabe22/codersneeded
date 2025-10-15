'use client'

import { QueryClient, QueryClientProvider } from 'react-query'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 30000, // Data stays fresh for 30 seconds
        cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
        refetchOnMount: false, // Don't refetch on component mount if data exists
        refetchOnReconnect: false, // Don't refetch on reconnect
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
            color: 'var(--tg-theme-text-color, #000000)',
          },
        }}
      />
    </QueryClientProvider>
  )
}

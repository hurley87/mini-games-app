'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-purple-500',
        className,
      )}
    />
  )
}

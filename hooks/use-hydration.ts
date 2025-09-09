"use client"

import { useEffect, useState } from 'react'

export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Set hydrated to true after the component mounts
    setIsHydrated(true)
  }, [])

  return isHydrated
}

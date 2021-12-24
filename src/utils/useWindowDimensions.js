import { useEffect, useState } from 'react'

const readDimensions = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
})

// Starts undefined so the server render and the first browser render match;
// the real size arrives after hydration.
export default function useWindowDimensions() {
  const [dimensions, setDimensions] = useState({
    width: undefined,
    height: undefined,
  })

  useEffect(() => {
    const handleResize = () => setDimensions(readDimensions())
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return dimensions
}

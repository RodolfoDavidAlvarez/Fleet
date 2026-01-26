'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PhotoGalleryProps {
  photos: string[]
  thumbnails?: string[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
}

export default function PhotoGallery({
  photos,
  thumbnails,
  initialIndex = 0,
  isOpen,
  onClose
}: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Reset index when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setIsZoomed(false)
    }
  }, [isOpen, initialIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const goToNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsZoomed(false)
    }
  }, [currentIndex, photos.length])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsZoomed(false)
    }
  }, [currentIndex])

  // Touch handlers for swipe
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && !isZoomed) {
      goToNext()
    }
    if (isRightSwipe && !isZoomed) {
      goToPrev()
    }
  }

  if (!isOpen || photos.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/95 flex flex-col"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <div className="text-sm font-medium">
            {currentIndex + 1} / {photos.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label={isZoomed ? "Zoom out" : "Zoom in"}
            >
              {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Main image area */}
        <div
          className="flex-1 flex items-center justify-center relative overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Previous button - hidden on mobile */}
          {currentIndex > 0 && (
            <button
              onClick={goToPrev}
              className="hidden sm:flex absolute left-4 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full items-center justify-center text-white transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`max-w-full max-h-full p-4 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={photos[currentIndex]}
              alt={`Photo ${currentIndex + 1}`}
              className={`max-h-[calc(100vh-180px)] w-auto mx-auto rounded-lg transition-transform duration-300 ${
                isZoomed ? 'scale-150' : 'scale-100'
              }`}
              style={{ objectFit: 'contain' }}
            />
          </motion.div>

          {/* Next button - hidden on mobile */}
          {currentIndex < photos.length - 1 && (
            <button
              onClick={goToNext}
              className="hidden sm:flex absolute right-4 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full items-center justify-center text-white transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="p-4 bg-black/50">
            <div className="flex gap-2 justify-center overflow-x-auto no-scrollbar">
              {(thumbnails || photos).map((thumb, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentIndex(i)
                    setIsZoomed(false)
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                    i === currentIndex
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={thumb}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            {/* Mobile swipe hint */}
            <p className="text-center text-white/60 text-xs mt-3 sm:hidden">
              Swipe left/right to navigate
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

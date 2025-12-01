"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PhotoGrid } from "./photo-grid"
import { SelectionControls } from "./selection-controls"
import { DownloadSection } from "./download-section"
import { UploadPhotos } from "./upload-photos"
import { ArrowLeft, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Photo {
  id: string
  url: string
}

interface Event {
  id: string
  name: string
  date: string
  thumbnail: string
  photos: Photo[]
  visible: boolean
}

export function EventGallery({ event }: { event: Event }) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [photos, setPhotos] = useState(event.photos)
  const [loading, setLoading] = useState(false)

  const loadPhotos = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/events/${event.id}/photos`)
      if (!response.ok) {
        throw new Error('Failed to fetch photos')
      }
      const eventPhotos = await response.json()
      setPhotos(eventPhotos)
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load photos dynamically if not already loaded
    if (photos.length === 0 || photos.length !== event.photos.length) {
      loadPhotos()
    }
  }, [event.id])

  const togglePhoto = (photoId: string) => {
    const newSelected = new Set(selectedPhotos)
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId)
    } else {
      newSelected.add(photoId)
    }
    setSelectedPhotos(newSelected)
  }

  const selectAll = () => {
    setSelectedPhotos(new Set(photos.map((p) => p.id)))
  }

  const clearSelection = () => {
    setSelectedPhotos(new Set())
  }

  const handleUploadComplete = () => {
    loadPhotos()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos eventos
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{event.name}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {formatDate(new Date(event.date))} • {photos.length} foto{photos.length !== 1 ? "s" : ""}
            {loading && <Loader2 className="w-4 h-4 inline ml-2 animate-spin" />}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <UploadPhotos eventId={event.id} onUploadComplete={handleUploadComplete} />

        <SelectionControls
          selectedCount={selectedPhotos.size}
          totalCount={photos.length}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
        />

        <PhotoGrid photos={photos} selectedPhotos={selectedPhotos} onTogglePhoto={togglePhoto} />

        {selectedPhotos.size > 0 && <DownloadSection event={{...event, date: new Date(event.date)}} selectedPhotoIds={Array.from(selectedPhotos)} />}
      </div>
    </main>
  )
}

"use client"

import { useState } from "react"
import type { Photo } from "@/lib/photo-service"
import { PhotoCard } from "./photo-card"
import { PhotoModal } from "./photo-modal"
import { Image as ImageIcon } from "lucide-react"

interface PhotoGridProps {
  photos: Photo[]
  selectedPhotos: Set<string>
  onTogglePhoto: (photoId: string) => void
}

export function PhotoGrid({ photos, selectedPhotos, onTogglePhoto }: PhotoGridProps) {
  const [selectedPhotoForModal, setSelectedPhotoForModal] = useState<Photo | null>(null)

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageIcon className="w-16 h-16 text-slate-400 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          Nenhuma foto encontrada
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          As fotos aparecerão aqui quando forem adicionadas ao evento.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            isSelected={selectedPhotos.has(photo.id)}
            onToggle={() => onTogglePhoto(photo.id)}
            onViewFullSize={() => setSelectedPhotoForModal(photo)}
          />
        ))}
      </div>

      {selectedPhotoForModal && (
        <PhotoModal photo={selectedPhotoForModal} onClose={() => setSelectedPhotoForModal(null)} />
      )}
    </>
  )
}

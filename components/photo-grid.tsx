"use client"

import { useState } from "react"
import type { Photo } from "@/lib/photo-service"
import { PhotoCard } from "./photo-card"
import { PhotoModal } from "./photo-modal"

interface PhotoGridProps {
  photos: Photo[]
  selectedPhotos: Set<string>
  onTogglePhoto: (photoId: string) => void
}

export function PhotoGrid({ photos, selectedPhotos, onTogglePhoto }: PhotoGridProps) {
  const [selectedPhotoForModal, setSelectedPhotoForModal] = useState<Photo | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
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

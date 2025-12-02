"use client"

import type { Photo } from "@/lib/events-data"
import { X } from "lucide-react"

interface PhotoModalProps {
  photo: Photo
  onClose: () => void
}

export function PhotoModal({ photo, onClose }: PhotoModalProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/75 z-50 transition-opacity" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative max-w-4xl max-h-[90vh] w-full bg-white dark:bg-slate-900 rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={photo.url || "/placeholder.svg"}
            alt={`Foto ampliada`}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </>
  )
}

"use client"

import { useState } from "react"
import type { Photo } from "@/lib/photo-service"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, ImageOff, Loader2 } from "lucide-react"

interface PhotoCardProps {
  photo: Photo
  isSelected: boolean
  onToggle: () => void
  onViewFullSize: () => void
}

export function PhotoCard({ photo, isSelected, onToggle, onViewFullSize }: PhotoCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onViewFullSize()
    }
  }

  return (
    <div
      className="relative group cursor-pointer rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 aspect-square focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      tabIndex={0}
      role="button"
      aria-label={`Foto ${photo.id}${isSelected ? ' (selecionada)' : ''}`}
      onClick={onViewFullSize}
      onKeyDown={handleKeyDown}
    >
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      )}

      {imageError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
          <ImageOff className="w-8 h-8 mb-2" />
          <span className="text-sm">Erro ao carregar</span>
        </div>
      ) : (
        <img
          src={photo.url || "/placeholder.svg"}
          alt={`Foto ${photo.id}`}
          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false)
            setImageError(true)
          }}
        />
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className={`p-2 rounded-full transition-colors ${
            isSelected
              ? "bg-blue-600 text-white"
              : "bg-white/80 dark:bg-slate-700/80 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-600"
          }`}
        >
          <Checkbox checked={isSelected} className="w-5 h-5 pointer-events-none" />
        </button>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onViewFullSize()
        }}
        className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 dark:bg-slate-700/80 rounded-full hover:bg-white dark:hover:bg-slate-600 text-slate-900 dark:text-white"
      >
        <Eye className="w-5 h-5" />
      </button>

      {isSelected && <div className="absolute inset-0 ring-2 ring-blue-600 rounded-lg" />}
    </div>
  )
}

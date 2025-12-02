"use client"

import React from "react"
import type { Photo } from "@/lib/photo-service"
import { Eye, ImageOff, Loader2 } from "lucide-react"

interface PhotoCardProps {
  photo: Photo
  isSelected: boolean
  onToggle: () => void
  onViewFullSize: () => void
}

export function PhotoCard({ photo, isSelected, onToggle, onViewFullSize }: PhotoCardProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle()
  }

  const handleEyeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onViewFullSize()
  }

  const handleCardClick = () => {
    onViewFullSize()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onViewFullSize()
    }
  }

  return (
    <div
      className={`relative group cursor-pointer rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 aspect-square focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isSelected ? 'ring-2 ring-blue-600' : ''
      }`}
      tabIndex={0}
      role="button"
      aria-label={`Foto ${photo.filename}${isSelected ? ' (selecionada)' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      {/* Loading State */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      )}

      {/* Error State */}
      {imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
          <ImageOff className="w-8 h-8 mb-2" />
          <span className="text-sm">Erro ao carregar</span>
        </div>
      )}

      {/* Image */}
      <img
        src={photo.url || "/placeholder.svg"}
        alt={`Foto ${photo.filename}`}
        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />

      {/* Checkbox */}
      <div
        className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 cursor-pointer ${
          isSelected
            ? "bg-blue-600 opacity-100"
            : "bg-white/90 dark:bg-slate-700/90 opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-slate-600"
        }`}
        onClick={handleCheckboxClick}
      >
        <div className="w-4 h-4 flex items-center justify-center">
          {isSelected && (
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Eye Button */}
      <button
        onClick={handleEyeClick}
        className="absolute bottom-2 left-2 p-2 rounded-full bg-white/90 dark:bg-slate-700/90 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white dark:hover:bg-slate-600 text-slate-900 dark:text-white"
      >
        <Eye className="w-5 h-5" />
      </button>
    </div>
  )
}

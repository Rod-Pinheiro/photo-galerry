"use client"

import type { Photo } from "@/lib/photo-service"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye } from "lucide-react"

interface PhotoCardProps {
  photo: Photo
  isSelected: boolean
  onToggle: () => void
  onViewFullSize: () => void
}

export function PhotoCard({ photo, isSelected, onToggle, onViewFullSize }: PhotoCardProps) {
  return (
    <div className="relative group cursor-pointer rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 aspect-square">
      <img
        src={photo.url || "/placeholder.svg"}
        alt={`Foto ${photo.id}`}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
      />

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
          <Checkbox checked={isSelected} onCheckedChange={() => onToggle()} className="w-5 h-5 pointer-events-none" />
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

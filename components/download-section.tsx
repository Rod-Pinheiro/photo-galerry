"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Event } from "@/lib/photo-service"
import { Download, Loader2 } from "lucide-react"

interface DownloadSectionProps {
  event: Event
  selectedPhotoIds: string[]
}

export function DownloadSection({ event, selectedPhotoIds }: DownloadSectionProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const JSZip = await import("jszip").then((m) => m.default)
      const zip = new JSZip()

      const photos = event.photos.filter((p) => selectedPhotoIds.includes(p.id))

      for (const photo of photos) {
        const response = await fetch(photo.url)
        const blob = await response.blob()
        const fileName = `${event.name.replace(/\s+/g, "_")}_${photo.id}.jpg`
        zip.file(fileName, blob)
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${event.name.replace(/\s+/g, "_")}_fotos.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Download error:", error)
      alert("Erro ao fazer download das fotos. Tente novamente.")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {selectedPhotoIds.length} foto{selectedPhotoIds.length !== 1 ? "s" : ""} pronta
            {selectedPhotoIds.length !== 1 ? "s" : ""} para download
          </div>

          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Baixando...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Baixar em ZIP
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

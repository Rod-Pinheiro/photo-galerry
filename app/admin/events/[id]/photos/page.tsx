"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, Loader2, X, Trash2, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

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

export default function EventPhotosPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/events`)
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      const events = await response.json()
      const foundEvent = events.find((e: Event) => e.id === eventId)

      if (!foundEvent) {
        throw new Error('Event not found')
      }

      setEvent(foundEvent)
    } catch (err) {
      console.error('Error fetching event:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    const validFiles = Array.from(files).filter(file => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      return allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024 // 10MB
    })

    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return

    try {
      setUploading(true)

      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch(`/api/admin/events/${eventId}/photos`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setSelectedFiles([])
        await fetchEvent() // Refresh event data
      } else {
        alert('Erro ao fazer upload das fotos')
      }
    } catch (err) {
      console.error('Error uploading files:', err)
      alert('Erro ao fazer upload das fotos')
    } finally {
      setUploading(false)
    }
  }

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) {
      return
    }

    try {
      setDeletingPhoto(photoId)
      const response = await fetch(`/api/admin/events/${eventId}/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchEvent() // Refresh event data
      } else {
        alert('Erro ao excluir foto')
      }
    } catch (err) {
      console.error('Error deleting photo:', err)
      alert('Erro ao excluir foto')
    } finally {
      setDeletingPhoto(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Evento não encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/admin/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/admin/events/${eventId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Fotos do Evento
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {event.name} • {event.photos.length} foto{event.photos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Fotos</CardTitle>
          <CardDescription>
            Adicione novas fotos ao evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-slate-300 dark:border-slate-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                Arraste e solte suas fotos aqui
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ou clique para selecionar arquivos
              </p>
              <p className="text-xs text-slate-400">
                JPEG, PNG, WebP até 10MB cada
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar Arquivos
            </Button>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-4">
                Arquivos selecionados ({selectedFiles.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="text-xs text-center mt-1 truncate" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={uploadFiles} disabled={uploading}>
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Upload className="mr-2 h-4 w-4" />
                  Fazer Upload ({selectedFiles.length} arquivo{selectedFiles.length !== 1 ? 's' : ''})
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Fotos Existentes</CardTitle>
          <CardDescription>
            {event.photos.length} foto{event.photos.length !== 1 ? 's' : ''} no evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {event.photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                Nenhuma foto neste evento ainda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {event.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                    <img
                      src={photo.url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg'
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deletePhoto(photo.id)}
                      disabled={deletingPhoto === photo.id}
                    >
                      {deletingPhoto === photo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
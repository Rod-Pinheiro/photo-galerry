"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Upload, Loader2, X, Trash2, Image as ImageIcon, Check, RotateCcw } from "lucide-react"
import Link from "next/link"
import { type Event } from "@/lib/photo-service"

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
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
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

      console.log('Event photos structure:', foundEvent.photos?.[0])
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
      console.log('Deleting photo:', photoId, 'from event:', eventId)
      const response = await fetch(`/api/admin/events/${eventId}/photos/${photoId}`, {
        method: 'DELETE',
      })

      console.log('Delete response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Delete response:', result)
        await fetchEvent() // Refresh event data
        setSelectedPhotos(prev => {
          const newSet = new Set(prev)
          newSet.delete(photoId)
          return newSet
        })
      } else {
        const errorData = await response.json()
        console.error('Delete error response:', errorData)
        alert(`Erro ao excluir foto: ${errorData.error || 'Status ' + response.status}`)
      }
    } catch (err) {
      console.error('Error deleting photo:', err)
      alert(`Erro ao excluir foto: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setDeletingPhoto(null)
    }
  }

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }

  const selectAllPhotos = () => {
    if (event) {
      setSelectedPhotos(new Set(event.photos.map(p => p.id)))
    }
  }

  const clearPhotoSelection = () => {
    setSelectedPhotos(new Set())
  }

  const bulkDeletePhotos = async () => {
    if (selectedPhotos.size === 0) return

    const count = selectedPhotos.size
    if (!confirm(`Tem certeza que deseja excluir ${count} foto${count !== 1 ? 's' : ''} selecionada${count !== 1 ? 's' : ''}?`)) {
      return
    }

    try {
      setBulkDeleting(true)
      const deletePromises = Array.from(selectedPhotos).map(photoId =>
        fetch(`/api/admin/events/${eventId}/photos/${photoId}`, {
          method: 'DELETE',
        })
      )

      const results = await Promise.all(deletePromises)
      const successCount = results.filter(r => r.ok).length

      if (successCount === count) {
        await fetchEvent() // Refresh event data
        setSelectedPhotos(new Set())
        alert(`${successCount} foto${successCount !== 1 ? 's' : ''} excluída${successCount !== 1 ? 's' : ''} com sucesso`)
      } else {
        alert(`Erro: ${count - successCount} foto${count - successCount !== 1 ? 's' : ''} não puderam ser excluída${count - successCount !== 1 ? 's' : ''}`)
        await fetchEvent() // Refresh anyway
      }
    } catch (err) {
      console.error('Error bulk deleting photos:', err)
      alert('Erro ao excluir fotos')
    } finally {
      setBulkDeleting(false)
    }
  }

  if (loading) {
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
              Carregando fotos...
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Evento: {eventId}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
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
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">
                  Arquivos selecionados ({selectedFiles.length})
                </h4>
                <div className="text-sm text-slate-500">
                  Total: {(selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedFiles.map((file, index) => {
                  const isValid = file.size <= 10 * 1024 * 1024
                  const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)

                  return (
                    <div key={index} className="relative group border rounded-lg p-3 bg-slate-50 dark:bg-slate-800">
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden shrink-0">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={isValidType ? "default" : "destructive"} className="text-xs">
                              {file.type.split('/')[1].toUpperCase()}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                          {!isValid && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Arquivo muito grande (máx. 10MB)
                            </p>
                          )}
                          {!isValidType && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Tipo não suportado
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-between items-center mt-4">
                <Button variant="outline" onClick={() => setSelectedFiles([])}>
                  Limpar Todos
                </Button>
                <Button
                  onClick={uploadFiles}
                  disabled={uploading || selectedFiles.some(file =>
                    file.size > 10 * 1024 * 1024 ||
                    !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
                  )}
                >
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Upload className="mr-2 h-4 w-4" />
                  Fazer Upload ({selectedFiles.length} arquivo{selectedFiles.length !== 1 ? 's' : ''})
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Controls */}
      {event.photos.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {selectedPhotos.size} de {event.photos.length} foto{event.photos.length !== 1 ? "s" : ""} selecionada{selectedPhotos.size !== 1 ? "s" : ""}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={selectAllPhotos}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={selectedPhotos.size === event.photos.length}
                >
                  <Check className="w-4 h-4" />
                  Selecionar Todas
                </Button>

                <Button
                  onClick={clearPhotoSelection}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={selectedPhotos.size === 0}
                >
                  <RotateCcw className="w-4 h-4" />
                  Limpar Seleção
                </Button>

                <Button
                  onClick={bulkDeletePhotos}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  disabled={selectedPhotos.size === 0 || bulkDeleting}
                >
                  {bulkDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Excluir Selecionadas ({selectedPhotos.size})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

                  {/* Selection Checkbox */}
                  {/* <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Checkbox
                      checked={selectedPhotos.has(photo.id)}
                      onCheckedChange={() => togglePhotoSelection(photo.id)}
                      className="bg-white/80 dark:bg-slate-700/80 border-slate-300 dark:border-slate-600"
                    />
                  </div> */}

                  {/* Delete Button */}
                  <div className="absolute inset-0 transition-all duration-200 rounded-lg flex items-center justify-center">
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

                  {/* Selection Indicator */}
                  {selectedPhotos.has(photo.id) && (
                    <div className="absolute inset-0 ring-2 ring-blue-600 rounded-lg pointer-events-none" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
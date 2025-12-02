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
         <div className="flex flex-col sm:flex-row sm:items-center gap-4">
           <Button variant="outline" size="icon" asChild className="self-start">
             <Link href={`/admin/events/${eventId}`}>
               <ArrowLeft className="h-4 w-4" />
             </Link>
           </Button>
           <div className="flex-1">
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
       <div className="flex flex-col sm:flex-row sm:items-center gap-4">
         <Button variant="outline" size="icon" asChild className="self-start">
           <Link href={`/admin/events/${eventId}`}>
             <ArrowLeft className="h-4 w-4" />
           </Link>
         </Button>
         <div className="flex-1">
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
              className={`border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-slate-400 mb-3 sm:mb-4" />
              <div className="space-y-1 sm:space-y-2">
                <p className="text-sm sm:text-base lg:text-lg font-medium">
                  Arraste e solte suas fotos aqui
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
                className="mt-3 sm:mt-4 w-full sm:w-auto text-sm"
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
               <div className="grid grid-cols-1 gap-3">
                 {selectedFiles.map((file, index) => {
                   const isValid = file.size <= 10 * 1024 * 1024
                   const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)

                   return (
                      <div key={index} className="relative group border rounded-lg p-3 sm:p-4 bg-slate-50 dark:bg-slate-800">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden shrink-0">
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
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                              <Badge variant={isValidType ? "default" : "destructive"} className="text-xs px-1 py-0">
                                {file.type.split('/')[1].toUpperCase()}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {(file.size / 1024 / 1024).toFixed(1)} MB
                              </span>
                            </div>
                            {(!isValid || !isValidType) && (
                              <div className="mt-1">
                                {!isValid && (
                                  <p className="text-xs text-red-600 dark:text-red-400">
                                    Arquivo muito grande (máx. 10MB)
                                  </p>
                                )}
                                {!isValidType && (
                                  <p className="text-xs text-red-600 dark:text-red-400">
                                    Tipo não suportado
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 shrink-0 opacity-60 hover:opacity-100"
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                   )
                 })}
              </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                  <Button variant="outline" onClick={() => setSelectedFiles([])} className="w-full sm:w-auto sm:mr-auto text-sm">
                    Limpar Todos
                  </Button>
                  <Button
                    onClick={uploadFiles}
                    disabled={uploading || selectedFiles.some(file =>
                      file.size > 10 * 1024 * 1024 ||
                      !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
                    )}
                    className="w-full sm:w-auto sm:ml-auto text-sm"
                  >
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Upload className="mr-2 h-4 w-4" />
                    <span className="hidden xs:inline">Fazer Upload ({selectedFiles.length} arquivo{selectedFiles.length !== 1 ? 's' : ''})</span>
                    <span className="xs:hidden">Upload ({selectedFiles.length})</span>
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
             <div className="flex flex-col gap-4">
               <div className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center sm:text-left">
                 {selectedPhotos.size} de {event.photos.length} foto{event.photos.length !== 1 ? "s" : ""} selecionada{selectedPhotos.size !== 1 ? "s" : ""}
               </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 sm:gap-3">
                    <Button
                      onClick={selectAllPhotos}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      disabled={selectedPhotos.size === event.photos.length}
                    >
                      <Check className="w-4 h-4" />
                      <span className="hidden xs:inline">Selecionar Todas</span>
                      <span className="xs:hidden">Todas</span>
                    </Button>

                    <Button
                      onClick={clearPhotoSelection}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      disabled={selectedPhotos.size === 0}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span className="hidden xs:inline">Limpar Seleção</span>
                      <span className="xs:hidden">Limpar</span>
                    </Button>
                  </div>

                  <Button
                    onClick={bulkDeletePhotos}
                    variant="destructive"
                    size="sm"
                    className="w-full gap-2"
                    disabled={selectedPhotos.size === 0 || bulkDeleting}
                  >
                    {bulkDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Excluir Selecionadas ({selectedPhotos.size})</span>
                    <span className="sm:hidden">Excluir ({selectedPhotos.size})</span>
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
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
               {event.photos.map((photo) => (
                 <div key={photo.id} className="relative group">
                   {/* Mobile: Click anywhere on image to toggle selection */}
                   <div
                     className="md:hidden aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm cursor-pointer"
                     onClick={() => togglePhotoSelection(photo.id)}
                   >
                     <img
                       src={photo.url}
                       alt=""
                       className="w-full h-full object-cover transition-transform duration-200"
                       onError={(e) => {
                         e.currentTarget.src = '/placeholder.svg'
                       }}
                     />
                     {/* Selection Checkbox - Mobile Only */}
                     <div className="absolute top-2 left-2">
                       <Checkbox
                         checked={selectedPhotos.has(photo.id)}
                         onCheckedChange={(e) => {
                           e.preventDefault()
                           e.stopPropagation()
                           togglePhotoSelection(photo.id)
                         }}
                         className="bg-white/90 dark:bg-slate-800/90 border-slate-300 dark:border-slate-600 w-5 h-5 pointer-events-none"
                       />
                     </div>

                   </div>

                   {/* Desktop: Hover to show delete button */}
                   <div className="hidden md:block aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
                     <img
                       src={photo.url}
                       alt=""
                       className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                       onError={(e) => {
                         e.currentTarget.src = '/placeholder.svg'
                       }}
                     />
                   </div>

                   {/* Delete Button - Desktop Only */}
                   <div className="hidden md:block absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
                       <Button
                         variant="destructive"
                         size="sm"
                         className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                         onClick={() => deletePhoto(photo.id)}
                         disabled={deletingPhoto === photo.id}
                       >
                         {deletingPhoto === photo.id ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <Trash2 className="h-4 w-4" />
                         )}
                         <span className="text-xs">Excluir</span>
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
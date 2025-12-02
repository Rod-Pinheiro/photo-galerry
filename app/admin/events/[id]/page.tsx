"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"

interface Event {
  id: string
  name: string
  date: string
  thumbnail: string
  photos: Array<{ id: string; url: string }>
  visible: boolean
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    visible: true
  })

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
      setFormData({
        name: foundEvent.name,
        date: new Date(foundEvent.date).toISOString().split('T')[0], // Format for date input
        visible: foundEvent.visible
      })
    } catch (err) {
      console.error('Error fetching event:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.date) {
      alert('Nome e data são obrigatórios')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          date: new Date(formData.date).toISOString(),
          visible: formData.visible
        }),
      })

      if (response.ok) {
        router.push('/admin/events')
      } else {
        alert('Erro ao salvar evento')
      }
    } catch (err) {
      console.error('Error updating event:', err)
      alert('Erro ao salvar evento')
    } finally {
      setSaving(false)
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
       <div className="flex flex-col sm:flex-row sm:items-center gap-4">
         <Button variant="outline" size="icon" asChild className="self-start">
           <Link href="/admin/events">
             <ArrowLeft className="h-4 w-4" />
           </Link>
         </Button>
         <div className="flex-1">
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
             Editar Evento
           </h1>
           <p className="text-slate-600 dark:text-slate-400 mt-2">
             {event.name} • {event.photos.length} foto{event.photos.length !== 1 ? 's' : ''}
           </p>
         </div>
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Evento</CardTitle>
              <CardDescription>
                Edite os detalhes do evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Evento</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome do evento"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data do Evento</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="visible"
                    checked={formData.visible}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visible: checked }))}
                  />
                  <Label htmlFor="visible">Evento visível na galeria pública</Label>
                </div>

                 <div className="flex flex-col sm:flex-row gap-2">
                   <Button type="submit" disabled={saving} className="sm:mr-2">
                     {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     <Save className="mr-2 h-4 w-4" />
                     Salvar Alterações
                   </Button>
                   <Button type="button" variant="outline" asChild>
                     <Link href="/admin/events">Cancelar</Link>
                   </Button>
                 </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Como aparecerá na galeria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg overflow-hidden">
                  <img
                    src={event.thumbnail}
                    alt={formData.name || event.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  {!formData.visible && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-medium">OCULTO</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg">
                    {formData.name || event.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {formData.date ? new Date(formData.date).toLocaleDateString('pt-BR') : new Date(event.date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                    {event.photos.length} foto{event.photos.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos Management */}
          <Card>
            <CardHeader>
              <CardTitle>Fotos do Evento</CardTitle>
              <CardDescription>
                Gerencie as fotos deste evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {event.photos.length} foto{event.photos.length !== 1 ? 's' : ''} no evento
                </div>

                 <div className="flex flex-col sm:flex-row gap-2">
                   <Button variant="outline" size="sm" asChild className="sm:mr-2">
                     <Link href={`/event/${event.id}`}>
                       Ver na Galeria
                     </Link>
                   </Button>
                   <Button variant="outline" size="sm" asChild>
                     <Link href={`/admin/events/${event.id}/photos`}>
                       Gerenciar Fotos
                     </Link>
                   </Button>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
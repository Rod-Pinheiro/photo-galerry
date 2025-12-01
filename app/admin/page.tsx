"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Image, Eye, EyeOff, Plus, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Event {
  id: string
  name: string
  date: string
  thumbnail: string
  photos: Array<{ id: string; url: string }>
  visible: boolean
}

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/events')
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      const data = await response.json()
      setEvents(data)
    } catch (err) {
      setError('Erro ao carregar eventos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async (eventId: string, currentVisibility: boolean) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visible: !currentVisibility }),
      })

      if (response.ok) {
        // Update local state
        setEvents(events.map(event =>
          event.id === eventId
            ? { ...event, visible: !currentVisibility }
            : event
        ))
      }
    } catch (err) {
      console.error('Error updating visibility:', err)
    }
  }

  const totalPhotos = events.reduce((sum, event) => sum + event.photos.length, 0)
  const visibleEvents = events.filter(event => event.visible).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Gerencie seus eventos e fotos
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              {visibleEvents} visíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fotos</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPhotos}</div>
            <p className="text-xs text-muted-foreground">
              Em todos os eventos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Ocultos</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length - visibleEvents}</div>
            <p className="text-xs text-muted-foreground">
              Não visíveis na galeria
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Recentes</CardTitle>
          <CardDescription>
            Lista de todos os eventos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">
                Nenhum evento encontrado
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                      <img
                        src={event.thumbnail}
                        alt={event.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg'
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {event.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(new Date(event.date))} • {event.photos.length} foto{event.photos.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={event.visible ? "default" : "secondary"}>
                      {event.visible ? (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Visível
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Oculto
                        </>
                      )}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVisibility(event.id, event.visible)}
                    >
                      {event.visible ? 'Ocultar' : 'Mostrar'}
                    </Button>

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/events/${event.id}`}>
                        Editar
                      </Link>
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
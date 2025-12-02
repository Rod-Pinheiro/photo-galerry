"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Image, Eye, EyeOff, Plus, MoreHorizontal, Search, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Event {
  id: string
  name: string
  date: string
  thumbnail: string
  photos: Array<{ id: string; url: string }>
  visible: boolean
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    const filtered = events.filter(event =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredEvents(filtered)
  }, [events, searchTerm])

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
      console.error('Error fetching events:', err)
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

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setEvents(events.filter(event => event.id !== eventId))
      }
    } catch (err) {
      console.error('Error deleting event:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Eventos</h1>
           <p className="text-slate-600 dark:text-slate-400 mt-2">
             Gerencie todos os eventos da galeria
           </p>
         </div>
         <Button asChild className="self-start sm:self-auto">
           <Link href="/admin/events/new">
             <Plus className="h-4 w-4 mr-2" />
             Novo Evento
           </Link>
         </Button>
       </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Eventos</CardTitle>
          <CardDescription>
            {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} encontrado{filteredEvents.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">
                {searchTerm ? 'Nenhum evento encontrado para a busca' : 'Nenhum evento cadastrado'}
              </p>
             </div>
           ) : (
             <>
               {/* Desktop Table */}
               <div className="hidden md:block">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Evento</TableHead>
                       <TableHead>Data</TableHead>
                       <TableHead>Fotos</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead className="w-[100px]">Ações</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredEvents.map((event) => (
                       <TableRow key={event.id}>
                         <TableCell>
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
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
                               <div className="font-medium">{event.name}</div>
                               <div className="text-sm text-slate-500 dark:text-slate-400">
                                 {event.id}
                               </div>
                             </div>
                           </div>
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center text-sm">
                             <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                             {formatDate(new Date(event.date))}
                           </div>
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center text-sm">
                             <Image className="h-4 w-4 mr-2 text-slate-400" />
                             {event.photos.length}
                           </div>
                         </TableCell>
                         <TableCell>
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
                         </TableCell>
                         <TableCell>
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" className="h-8 w-8 p-0">
                                 <MoreHorizontal className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               <DropdownMenuItem asChild>
                                 <Link href={`/admin/events/${event.id}`}>
                                   Editar
                                 </Link>
                               </DropdownMenuItem>
                               <DropdownMenuItem
                                 onClick={() => toggleVisibility(event.id, event.visible)}
                               >
                                 {event.visible ? 'Ocultar' : 'Mostrar'}
                               </DropdownMenuItem>
                               <DropdownMenuItem
                                 className="text-red-600 dark:text-red-400"
                                 onClick={() => deleteEvent(event.id)}
                               >
                                 Excluir
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-4">
                  {filteredEvents.map((event) => (
                    <Card key={event.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={event.thumbnail}
                              alt={event.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg'
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 dark:text-white truncate">
                              {event.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                              {event.id}
                            </p>

                            {/* Status Badge */}
                            <div className="mb-3">
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
                            </div>

                            {/* Event Info */}
                            <div className="space-y-2 mb-3 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-sm">{formatDate(new Date(event.date))}</span>
                              </div>
                              <div className="flex items-center">
                                <Image className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-sm">{event.photos.length} foto{event.photos.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                    <MoreHorizontal className="h-4 w-4 mr-2" />
                                    Ações
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/events/${event.id}`}>
                                      Editar
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => toggleVisibility(event.id, event.visible)}
                                  >
                                    {event.visible ? 'Ocultar' : 'Mostrar'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600 dark:text-red-400"
                                    onClick={() => deleteEvent(event.id)}
                                  >
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
             </>
           )}
        </CardContent>
      </Card>
    </div>
  )
}
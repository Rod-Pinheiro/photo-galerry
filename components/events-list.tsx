"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

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
}

export function EventsList() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true)
        const response = await fetch('/api/events')
        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }
        const eventsData = await response.json()
        setEvents(eventsData)
      } catch (err) {
        console.error('Error loading events:', err)
        setError('Erro ao carregar eventos')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600 dark:text-slate-400">Carregando eventos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center min-h-[400px] flex items-center justify-center">
          <div className="text-red-600 dark:text-red-400">
            <p className="text-lg font-medium mb-2">Erro ao carregar eventos</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Link key={event.id} href={`/event/${event.id}`} className="group">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden h-full cursor-pointer border border-slate-200 dark:border-slate-700">
              <div className="relative w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
                <img
                  src={event.thumbnail || "/placeholder.svg"}
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              </div>

              <div className="p-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {event.name}
                </h2>

                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-2">
                  <Calendar className="w-4 h-4" />
                  <time>{formatDate(new Date(event.date))}</time>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-500 mt-3">
                  {event.photos.length} foto{event.photos.length !== 1 ? "s" : ""}
                </p>

                <div className="mt-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-sm font-medium text-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  Ver fotos
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

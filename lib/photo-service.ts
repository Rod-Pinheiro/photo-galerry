import { ensureBucketExists, uploadPhoto, listPhotos, getPhotoUrl, listTopLevelFolders } from './minio'
import { Client as MinIOClient } from 'minio'
import { prisma } from './prisma'

export interface Photo {
  id: string
  url: string
}

export interface Event {
  id: string
  name: string
  date: Date
  thumbnail: string
  photos: Photo[]
  visible: boolean
}

// Initialize MinIO bucket on startup
if (typeof window === 'undefined') {
  ensureBucketExists().catch(console.error)
}

// Mock events for development fallback
export const MOCK_EVENTS: Event[] = [
  {
    id: "evento-1",
    name: "Casamento - Maria & João",
    date: new Date(2025, 0, 15),
    thumbnail: "/casamento.jpg",
    photos: [],
    visible: true,
  },
  {
    id: "evento-2",
    name: "Formatura - Turma 2024",
    date: new Date(2024, 11, 20),
    thumbnail: "/formatura.jpg",
    photos: [],
    visible: true,
  },
  {
    id: "evento-3",
    name: "Aniversário - Sofia 15 anos",
    date: new Date(2024, 10, 10),
    thumbnail: "/anivers-rio.jpg",
    photos: [],
    visible: true,
  },
  {
    id: "evento-4",
    name: "Corporativo - Conferência Tech 2024",
    date: new Date(2024, 9, 5),
    thumbnail: "/corporativo.jpg",
    photos: [],
    visible: true,
  },
  {
    id: "evento-5",
    name: "Batizado - Lucas",
    date: new Date(2024, 8, 22),
    thumbnail: "/batizado.jpg",
    photos: [],
    visible: true,
  },
  {
    id: "evento-6",
    name: "Casamento - Pedro & Ana",
    date: new Date(2024, 7, 14),
    thumbnail: "/casamento.jpg",
    photos: [],
    visible: true,
  },
]

// Cache for events metadata
let eventsCache: Event[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getAllEvents(): Promise<Event[]> {
  // Check cache first
  if (eventsCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return eventsCache
  }

  try {
    // Get all events from database
    const dbEvents = await prisma.event.findMany({
      include: {
        photos: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Convert to our Event interface format
    const events: Event[] = dbEvents.map(dbEvent => ({
      id: dbEvent.id,
      name: dbEvent.name,
      date: dbEvent.date,
      thumbnail: dbEvent.thumbnail || '/placeholder.jpg',
      photos: dbEvent.photos.map(photo => ({
        id: photo.id,
        url: photo.url
      })),
      visible: dbEvent.visible
    }))

    // Get all top-level folders from MinIO for events that might not be in DB yet
    const folders = await listTopLevelFolders()
    console.log('Found folders in MinIO:', folders)

    // Create events from folders that don't exist in DB
    const folderEvents: Event[] = await Promise.all(
      folders
        .filter(folderName => !dbEvents.some(event => event.id === folderName))
        .map(async (folderName) => {
          const photos = await getEventPhotos(folderName)
          const thumbnail = photos.length > 0 ? photos[0].url : '/placeholder.jpg'

          return {
            id: folderName,
            name: folderName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Capitalize words
            date: new Date(), // Use current date for auto-detected events
            thumbnail,
            photos,
            visible: true
          }
        })
    )

    const allEvents = [...events, ...folderEvents]

    // Sort by date (newest first)
    eventsCache = allEvents.sort((a, b) => b.date.getTime() - a.date.getTime())
    cacheTimestamp = Date.now()
    return eventsCache

  } catch (error) {
    console.error('Error loading events from database:', error)
  }

  // Fallback to mock data
  console.log('Using mock events data')
  eventsCache = [...MOCK_EVENTS].sort((a, b) => b.date.getTime() - a.date.getTime())
  cacheTimestamp = Date.now()
  return eventsCache
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const events = await getAllEvents()
  return events.find((event) => event.id === id)
}

export async function createEvent(name: string, date: Date, thumbnail?: File): Promise<Event> {
  const eventId = `evento-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  let thumbnailUrl = "/placeholder.jpg"

  if (thumbnail) {
    const thumbnailFilename = `${eventId}/thumbnail.jpg`
    const buffer = await thumbnail.arrayBuffer()
    thumbnailUrl = await uploadPhoto(Buffer.from(buffer), thumbnailFilename, thumbnail.type)
  }

  // Create event in database
  const newEvent = await prisma.event.create({
    data: {
      id: eventId,
      name,
      date,
      thumbnail: thumbnailUrl,
      visible: true,
    }
  })

  // Clear cache
  eventsCache = null

  return {
    id: newEvent.id,
    name: newEvent.name,
    date: newEvent.date,
    thumbnail: newEvent.thumbnail || '/placeholder.jpg',
    photos: [],
    visible: newEvent.visible
  }
}

// API functions for photo management
export async function uploadEventPhoto(eventId: string, file: File): Promise<Photo> {
  const filename = `${eventId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const buffer = await file.arrayBuffer()

  const url = await uploadPhoto(Buffer.from(buffer), filename, file.type)

  // Save photo to database
  const photo = await prisma.photo.create({
    data: {
      id: filename,
      filename,
      url,
      eventId,
    }
  })

  // Invalidate cache
  eventsCache = null

  return {
    id: photo.id,
    url: photo.url,
  }
}

export async function getEventPhotos(eventId: string, limit?: number): Promise<Photo[]> {
  try {
    // Get photos from database
    const photos = await prisma.photo.findMany({
      where: {
        eventId: eventId
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: limit
    })

    return photos.map(photo => ({
      id: photo.id,
      url: photo.url
    }))
  } catch (error) {
    console.error('Error loading photos for event:', eventId, error)
    return []
  }
}

export async function deleteEventPhoto(eventId: string, photoId: string): Promise<void> {
  try {
    // Delete from database
    await prisma.photo.delete({
      where: {
        id: photoId
      }
    })

    // Delete from MinIO
    const { deletePhoto } = await import('./minio')
    await deletePhoto(photoId)

    // Invalidate cache
    eventsCache = null
  } catch (error) {
    console.error('Error deleting photo:', photoId, error)
    throw error
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    console.log('deleteEvent: Starting deletion for eventId:', eventId)

    // Delete all photos from MinIO
    const { deleteAllPhotosWithPrefix } = await import('./minio')
    console.log('deleteEvent: Deleting photos from MinIO with prefix:', `${eventId}/`)
    await deleteAllPhotosWithPrefix(`${eventId}/`)

    // Try to delete from database first
    try {
      console.log('deleteEvent: Attempting to delete from database')
      await prisma.event.delete({
        where: {
          id: eventId
        }
      })
      console.log('deleteEvent: Deleted from database')
    } catch (dbError: any) {
      console.log('deleteEvent: Event not in database, checking metadata')
      // If not in database, delete from metadata
      const { loadEventMetadata, saveEventMetadata } = await import('./minio')
      const currentEvents = await loadEventMetadata()
      const filteredEvents = currentEvents.filter((e: any) => e.id !== eventId)

      if (filteredEvents.length < currentEvents.length) {
        await saveEventMetadata(filteredEvents)
        console.log('deleteEvent: Deleted from metadata')
      } else {
        console.log('deleteEvent: Event not found in metadata either')
      }
    }

    // Clear cache
    eventsCache = null
    console.log('deleteEvent: Deletion completed successfully')
  } catch (error) {
    console.error('Error deleting event:', eventId, error)
    throw error
  }
}

export async function invalidateEventsCache() {
  eventsCache = null
  cacheTimestamp = 0
}
import { ensureBucketExists, uploadPhoto, listPhotos, loadEventMetadata, saveEventMetadata, getPhotoUrl, listTopLevelFolders } from './minio'
import { Client as MinIOClient } from 'minio'

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
    // First, try to load manual events from metadata
    let manualEvents: any[] = []
    try {
      manualEvents = await loadEventMetadata()
    } catch (error) {
      console.log('No metadata file found, will create from folders')
    }

    // Get all top-level folders from MinIO
    const folders = await listTopLevelFolders()
    console.log('Found folders in MinIO:', folders)

    // Create events from folders
    const folderEvents: Event[] = await Promise.all(
      folders.map(async (folderName) => {
        // Check if this folder already has a manual event
        const existingEvent = manualEvents.find(event => event.id === folderName)

        if (existingEvent) {
          // Use existing metadata but load photos dynamically
          return {
            ...existingEvent,
            date: new Date(existingEvent.date),
            photos: await getEventPhotos(folderName),
            visible: existingEvent.visible ?? true
          }
        } else {
          // Check if this folder has been manually configured before
          const manualEvent = manualEvents.find((e: any) => e.id === folderName)

          if (manualEvent) {
            // Use manual configuration
            return {
              ...manualEvent,
              date: new Date(manualEvent.date),
              photos: await getEventPhotos(folderName),
              visible: manualEvent.visible ?? true
            }
          } else {
            // Create automatic event from folder
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
          }
        }
      })
    )

    // Combine manual events that don't have folders with folder events
    const manualOnlyEvents = manualEvents
      .filter(event => !folders.includes(event.id))
      .map(event => ({
        ...event,
        date: new Date(event.date),
        photos: [], // Manual events without folders won't have photos
        visible: event.visible ?? true
      }))

    const allEvents = [...folderEvents, ...manualOnlyEvents]

    // Sort by date (newest first)
    eventsCache = allEvents.sort((a, b) => b.date.getTime() - a.date.getTime())
    cacheTimestamp = Date.now()
    return eventsCache

  } catch (error) {
    console.error('Error loading events from MinIO:', error)
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

  const newEvent = {
    id: eventId,
    name,
    date,
    thumbnail: thumbnailUrl,
    visible: true,
  }

  // TODO: Create folder in MinIO

  // Load current events and add new one
  const currentEvents = await loadEventMetadata()
  const updatedEvents = [...currentEvents, newEvent]

  // Save to MinIO
  await saveEventMetadata(updatedEvents)

  // Clear cache
  eventsCache = null

  return {
    ...newEvent,
    photos: []
  }
}

// API functions for photo management
export async function uploadEventPhoto(eventId: string, file: File): Promise<Photo> {
  const filename = `${eventId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const buffer = await file.arrayBuffer()

  const url = await uploadPhoto(Buffer.from(buffer), filename, file.type)

  return {
    id: filename,
    url: url,
  }
}

export async function getEventPhotos(eventId: string, limit?: number): Promise<Photo[]> {
  try {
    const { photos: photoKeys } = await listPhotos(`${eventId}/`, limit)

    // Convert keys to Photo objects
    const photos: Photo[] = photoKeys
      .filter(key => !key.includes('thumbnail')) // Exclude thumbnails from photo list
      .map(key => ({
        id: key,
        url: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:9000/photos/${key}`
      }))

    return photos
  } catch (error) {
    console.error('Error loading photos for event:', eventId, error)
    return []
  }
}

export async function invalidateEventsCache() {
  eventsCache = null
  cacheTimestamp = 0
}
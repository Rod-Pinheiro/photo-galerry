import { ensureBucketExists, uploadPhoto, listPhotos, getPhotoUrl, listTopLevelFolders } from './minio'
import { Client as MinIOClient } from 'minio'
import { db } from './db'

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

// Initialize MinIO bucket on startup (only in runtime, not during build)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
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

export async function getAllEvents(forceRefresh = false): Promise<Event[]> {
  // Check cache first
  if (!forceRefresh && eventsCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return eventsCache
  }

  try {
    // Get all events from database
    const eventsQuery = await db.query(`
      SELECT id, name, date, thumbnail, visible, created_at, updated_at
      FROM events
      ORDER BY date DESC
    `)

    // Get all photos
    const photosQuery = await db.query(`
      SELECT id, url, event_id, created_at
      FROM photos
      ORDER BY created_at ASC
    `)

    // Group photos by event_id
    const photosByEvent: Record<string, any[]> = {}
    photosQuery.rows.forEach(photo => {
      if (!photosByEvent[photo.event_id]) {
        photosByEvent[photo.event_id] = []
      }
      photosByEvent[photo.event_id].push({
        id: photo.id,
        url: photo.url
      })
    })

    // Convert to our Event interface format
    const events: Event[] = eventsQuery.rows.map(dbEvent => ({
      id: dbEvent.id,
      name: dbEvent.name,
      date: new Date(dbEvent.date),
      thumbnail: dbEvent.thumbnail || '/placeholder.jpg',
      photos: photosByEvent[dbEvent.id] || [],
      visible: dbEvent.visible
    }))

    // Only try to get MinIO folders if not in build time
    let folderEvents: Event[] = []
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE !== 'phase-production-build') {
      try {
        // Get all top-level folders from MinIO for events that might not be in DB yet
        const folders = await listTopLevelFolders()
        console.log('Found folders in MinIO:', folders)

        // Create events from folders that don't exist in DB
        folderEvents = await Promise.all(
          folders
            .filter(folderName => !eventsQuery.rows.some((event: any) => event.id === folderName))
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
      } catch (minioError) {
        console.log('MinIO not available, skipping folder detection')
      }
    }

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
  try {
    // Query database directly to avoid cache issues
    const eventQuery = await db.query(`
      SELECT id, name, date, thumbnail, visible
      FROM events
      WHERE id = $1
    `, [id])

    if (eventQuery.rows.length === 0) {
      return undefined
    }

    const dbEvent = eventQuery.rows[0]

    // Get photos
    const photosQuery = await db.query(`
      SELECT id, url
      FROM photos
      WHERE event_id = $1
      ORDER BY created_at ASC
    `, [id])

    const photos = photosQuery.rows.map((photo: any) => ({
      id: photo.id,
      url: photo.url
    }))

    return {
      id: dbEvent.id,
      name: dbEvent.name,
      date: new Date(dbEvent.date),
      thumbnail: dbEvent.thumbnail || '/placeholder.jpg',
      photos,
      visible: dbEvent.visible
    }
  } catch (error) {
    console.error('Error in getEventById:', error)
    return undefined
  }
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
  const result = await db.query(`
    INSERT INTO events (id, name, date, thumbnail, visible)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, date, thumbnail, visible
  `, [eventId, name, date, thumbnailUrl, true])

  const newEvent = result.rows[0]

  // Clear cache
  eventsCache = null

  return {
    id: newEvent.id,
    name: newEvent.name,
    date: new Date(newEvent.date),
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
  const result = await db.query(`
    INSERT INTO photos (id, filename, url, event_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, url
  `, [filename, filename, url, eventId])

  const photo = result.rows[0]

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
    const query = limit
      ? `SELECT id, url FROM photos WHERE event_id = $1 ORDER BY created_at ASC LIMIT $2`
      : `SELECT id, url FROM photos WHERE event_id = $1 ORDER BY created_at ASC`

    const result = limit
      ? await db.query(query, [eventId, limit])
      : await db.query(query, [eventId])

    return result.rows.map((photo: any) => ({
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
    await db.query(`DELETE FROM photos WHERE id = $1`, [photoId])

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
      await db.query(`DELETE FROM events WHERE id = $1`, [eventId])
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
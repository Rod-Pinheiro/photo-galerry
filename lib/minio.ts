import { Client } from 'minio'

export const BUCKET_NAME = process.env.MINIO_BUCKET || 'photos'

let minioClient: Client | null = null

function getMinioClient(): Client {
  if (!minioClient) {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost'
    console.log('Creating MinIO client with endpoint:', endpoint, 'port:', 9000)
    minioClient = new Client({
      endPoint: endpoint,
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    })
  }
  return minioClient
}

export async function ensureBucketExists() {
  try {
    const client = getMinioClient()
    const exists = await client.bucketExists(BUCKET_NAME)
    if (!exists) {
      await client.makeBucket(BUCKET_NAME)
      console.log(`Bucket ${BUCKET_NAME} created`)
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error)
    // Don't throw error during initialization
  }
}

export async function uploadPhoto(file: Buffer, filename: string, contentType: string = 'image/jpeg') {
  try {
    const client = getMinioClient()
    await client.putObject(BUCKET_NAME, filename, file, file.length, {
      'Content-Type': contentType,
    })

    // Use public URL for browser access, with fallback logic
    const publicUrl = process.env.MINIO_PUBLIC_URL
    if (publicUrl) {
      // Remove trailing slash and ensure it ends with the bucket path
      const baseUrl = publicUrl.replace(/\/$/, '')
      return `${baseUrl}/${BUCKET_NAME}/${filename}`
    }

    // Fallback to localhost for development
    return `http://localhost:9000/${BUCKET_NAME}/${filename}`
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw error
  }
}

export async function getPhotoUrl(filename: string) {
  // Use public URL for browser access, with fallback logic
  const publicUrl = process.env.MINIO_PUBLIC_URL
  if (publicUrl) {
    // Remove trailing slash and ensure it ends with the bucket path
    const baseUrl = publicUrl.replace(/\/$/, '')
    return `${baseUrl}/${BUCKET_NAME}/${filename}`
  }

  // Fallback to localhost for development
  return `http://localhost:9000/${BUCKET_NAME}/${filename}`
}

export async function deletePhoto(filename: string) {
  try {
    const client = getMinioClient()
    await client.removeObject(BUCKET_NAME, filename)
  } catch (error) {
    console.error('Error deleting photo:', error)
    throw error
  }
}

export async function deleteAllPhotosWithPrefix(prefix: string) {
  try {
    const client = getMinioClient()
    const objectsToDelete: string[] = []
    const stream = client.listObjectsV2(BUCKET_NAME, prefix, true)

    return new Promise<void>((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          objectsToDelete.push(obj.name)
        }
      })
      stream.on('end', async () => {
        if (objectsToDelete.length > 0) {
          await client.removeObjects(BUCKET_NAME, objectsToDelete)
          console.log(`Deleted ${objectsToDelete.length} objects with prefix ${prefix}`)
        }
        resolve()
      })
      stream.on('error', reject)
    })
  } catch (error) {
    console.error('Error deleting photos with prefix:', error)
    throw error
  }
}

export async function listPhotos(prefix?: string, limit?: number, marker?: string) {
  try {
    const client = getMinioClient()
    const stream = client.listObjectsV2(BUCKET_NAME, prefix, true, marker)
    const photos: string[] = []
    let count = 0

    return new Promise<{ photos: string[], isTruncated: boolean }>((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name && (!limit || count < limit)) {
          photos.push(obj.name)
          count++
        }
      })
      stream.on('end', () => {
        // Check if we reached the limit to determine if there are more items
        const isTruncated = limit ? count >= limit : false
        resolve({ photos, isTruncated })
      })
      stream.on('error', reject)
    })
  } catch (error) {
    console.error('Error listing photos:', error)
    throw error
  }
}

export async function getPresignedUrl(filename: string, expirySeconds: number = 3600) {
  try {
    const client = getMinioClient()
    return await client.presignedGetObject(BUCKET_NAME, filename, expirySeconds)
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw error
  }
}

export async function getPresignedPutUrl(filename: string, expirySeconds: number = 3600) {
  try {
    const client = getMinioClient()
    return await client.presignedPutObject(BUCKET_NAME, filename, expirySeconds)
  } catch (error) {
    console.error('Error generating presigned PUT URL:', error)
    throw error
  }
}

export async function listFolders(prefix?: string) {
  try {
    const client = getMinioClient()
    const stream = client.listObjectsV2(BUCKET_NAME, prefix, true)
    const folders: string[] = []

    return new Promise<string[]>((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name && obj.name.endsWith('/')) {
          // Remove trailing slash for folder names
          folders.push(obj.name.slice(0, -1))
        }
      })
      stream.on('end', () => resolve([...new Set(folders)])) // Remove duplicates
      stream.on('error', reject)
    })
  } catch (error) {
    console.error('Error listing folders:', error)
    throw error
  }
}

export async function listTopLevelFolders() {
  try {
    const client = getMinioClient()
    const stream = client.listObjectsV2(BUCKET_NAME, '', true)
    const folders: string[] = []

    return new Promise<string[]>((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name && obj.name.includes('/')) {
          // Extract top-level folder name
          const folderName = obj.name.split('/')[0]
          if (folderName && !folders.includes(folderName)) {
            folders.push(folderName)
          }
        }
      })
      stream.on('end', () => resolve(folders))
      stream.on('error', (error) => {
        console.error('Error listing top-level folders:', error)
        resolve([]) // Return empty array instead of failing
      })
    })
  } catch (error) {
    console.error('Error listing top-level folders:', error)
    return [] // Return empty array instead of throwing
  }
}

// Event metadata persistence
export const EVENTS_METADATA_KEY = 'events/metadata.json'

export async function saveEventMetadata(events: any[]) {
  try {
    console.log('Saving event metadata for', events.length, 'events')
    // Convert Date objects to ISO strings for JSON serialization
    const serializableEvents = events.map(event => ({
      ...event,
      date: event.date instanceof Date ? event.date.toISOString() : event.date
    }))
    const metadata = JSON.stringify(serializableEvents, null, 2)
    console.log('Metadata JSON length:', metadata.length)
    const buffer = Buffer.from(metadata, 'utf8')
    console.log('Buffer length:', buffer.length)
    const client = getMinioClient()
    await client.putObject(BUCKET_NAME, EVENTS_METADATA_KEY, buffer, buffer.length, {
      'Content-Type': 'application/json',
    })
    console.log('Event metadata saved to MinIO successfully')
  } catch (error) {
    console.error('Error saving event metadata:', error)
    throw error
  }
}

export async function loadEventMetadata(): Promise<any[]> {
  try {
    console.log('Loading event metadata from', EVENTS_METADATA_KEY)
    const client = getMinioClient()
    const stream = await client.getObject(BUCKET_NAME, EVENTS_METADATA_KEY)
    let data = ''

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        data += chunk
      })
      stream.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          console.log('Parsed metadata:', typeof parsed, Array.isArray(parsed) ? 'array' : 'object')
          if (Array.isArray(parsed)) {
            console.log('Loaded', parsed.length, 'events from metadata')
            resolve(parsed)
          } else {
            console.log('Metadata is not an array, using empty array')
            resolve([])
          }
        } catch (parseError) {
          console.error('Error parsing event metadata:', parseError)
          resolve([])
        }
      })
      stream.on('error', (error) => {
        console.error('Error loading event metadata:', error)
        resolve([]) // Return empty array if file doesn't exist
      })
    })
  } catch (error) {
    console.error('Error loading event metadata:', error)
    return []
  }
}
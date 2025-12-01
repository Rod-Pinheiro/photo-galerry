import { Client } from 'minio'

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
})

export const BUCKET_NAME = process.env.MINIO_BUCKET || 'photos'

export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME)
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME)
      console.log(`Bucket ${BUCKET_NAME} created`)
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error)
  }
}

export async function uploadPhoto(file: Buffer, filename: string, contentType: string = 'image/jpeg') {
  try {
    await minioClient.putObject(BUCKET_NAME, filename, file, file.length, {
      'Content-Type': contentType,
    })
    return `http://${process.env.MINIO_ENDPOINT || 'localhost'}:9000/${BUCKET_NAME}/${filename}`
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw error
  }
}

export async function getPhotoUrl(filename: string) {
  return `http://${process.env.MINIO_ENDPOINT || 'localhost'}:9000/${BUCKET_NAME}/${filename}`
}

export async function deletePhoto(filename: string) {
  try {
    await minioClient.removeObject(BUCKET_NAME, filename)
  } catch (error) {
    console.error('Error deleting photo:', error)
    throw error
  }
}

export async function listPhotos(prefix?: string, limit?: number, marker?: string) {
  try {
    const stream = minioClient.listObjectsV2(BUCKET_NAME, prefix, true, marker)
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
    return await minioClient.presignedGetObject(BUCKET_NAME, filename, expirySeconds)
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw error
  }
}

export async function getPresignedPutUrl(filename: string, expirySeconds: number = 3600) {
  try {
    return await minioClient.presignedPutObject(BUCKET_NAME, filename, expirySeconds)
  } catch (error) {
    console.error('Error generating presigned PUT URL:', error)
    throw error
  }
}

export async function listFolders(prefix?: string) {
  try {
    const stream = minioClient.listObjectsV2(BUCKET_NAME, prefix, true)
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
    const stream = minioClient.listObjectsV2(BUCKET_NAME, '', true)
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
      stream.on('error', reject)
    })
  } catch (error) {
    console.error('Error listing top-level folders:', error)
    throw error
  }
}

// Event metadata persistence
export const EVENTS_METADATA_KEY = 'events/metadata.json'

export async function saveEventMetadata(events: any[]) {
  try {
    const metadata = JSON.stringify(events, null, 2)
    await minioClient.putObject(BUCKET_NAME, EVENTS_METADATA_KEY, metadata, metadata.length, {
      'Content-Type': 'application/json',
    })
    console.log('Event metadata saved to MinIO')
  } catch (error) {
    console.error('Error saving event metadata:', error)
    throw error
  }
}

export async function loadEventMetadata(): Promise<any[]> {
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, EVENTS_METADATA_KEY)
    let data = ''

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        data += chunk
      })
      stream.on('end', () => {
        try {
          resolve(JSON.parse(data))
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
import { NextRequest, NextResponse } from 'next/server'
import { uploadEventPhoto, invalidateEventsCache, getEventPhotos } from '@/lib/photo-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const eventId = resolvedParams.id

    const photos = await getEventPhotos(eventId)
    return NextResponse.json(photos)
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const eventId = resolvedParams.id

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({
          error: `File type ${file.type} not allowed. Only JPEG, PNG, and WebP are supported.`
        }, { status: 400 })
      }

      if (file.size > maxSize) {
        return NextResponse.json({
          error: `File ${file.name} is too large. Maximum size is 10MB.`
        }, { status: 400 })
      }
    }

    // Upload all files
    const uploadPromises = files.map(file => uploadEventPhoto(eventId, file))
    const uploadedPhotos = await Promise.all(uploadPromises)

    // Invalidate cache to refresh photo counts
    invalidateEventsCache()

    return NextResponse.json({
      message: `Successfully uploaded ${uploadedPhotos.length} photo(s)`,
      photos: uploadedPhotos
    })
  } catch (error) {
    console.error('Error uploading photos:', error)
    return NextResponse.json({ error: 'Failed to upload photos' }, { status: 500 })
  }
}
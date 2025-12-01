import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { deletePhoto, loadEventMetadata, saveEventMetadata } from '@/lib/minio'
import { invalidateEventsCache } from '@/lib/photo-service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    // Verify admin session
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const eventId = resolvedParams.id
    const photoId = resolvedParams.photoId

    // Delete from MinIO
    await deletePhoto(photoId)

    // Update metadata to remove the deleted photo
    try {
      const currentEvents = await loadEventMetadata()
      const eventIndex = currentEvents.findIndex((event: any) => event.id === eventId)

      if (eventIndex !== -1) {
        // Remove the deleted photo from the event's photos array
        currentEvents[eventIndex].photos = currentEvents[eventIndex].photos.filter(
          (photo: any) => photo.id !== photoId
        )

        // Save updated metadata
        await saveEventMetadata(currentEvents)
      }
    } catch (metadataError) {
      console.error('Error updating metadata:', metadataError)
      // Don't fail the request if metadata update fails
    }

    // Invalidate cache to refresh photo counts
    invalidateEventsCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 })
  }
}
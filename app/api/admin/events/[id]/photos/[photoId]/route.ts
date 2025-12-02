import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { deleteEventPhoto, invalidateEventsCache } from '@/lib/photo-service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    console.log('DELETE request received')
    
    // Verify admin session
    const session = await getSessionFromRequest(request)
    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const eventId = resolvedParams.id
    const photoId = decodeURIComponent(resolvedParams.photoId)

    console.log('Deleting photo:', photoId, 'from event:', eventId)

    // Delete from database and MinIO
    await deleteEventPhoto(eventId, photoId)

    console.log('Photo deleted successfully')

    // Invalidate cache to refresh photo counts
    invalidateEventsCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete photo' }, { status: 500 })
  }
}
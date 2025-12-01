import { NextRequest, NextResponse } from 'next/server'
import { getAllEvents, deleteEvent, invalidateEventsCache } from '@/lib/photo-service'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/admin/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('GET /api/admin/events/[id] called')
    // Verify admin session
    const session = await getSessionFromRequest(request)
    if (!session) {
      console.log('Unauthorized access')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const eventId = resolvedParams.id
    console.log('Looking for event ID:', eventId)

    const events = await getAllEvents()
    console.log('Loaded events count:', events.length)
    console.log('Available events:', events.map((e: any) => e.id))
    const event = events.find((e: any) => e.id === eventId)
    console.log('Found event:', event ? 'yes' : 'no')

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

// PUT /api/admin/events/[id] - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin session
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const eventId = resolvedParams.id
    console.log('Updating event:', eventId)

    const body = await request.json()
    const { name, date, visible } = body
    console.log('Update data:', { name, date, visible })

    // Update event in database
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (date !== undefined) updateData.date = new Date(date)
    if (visible !== undefined) updateData.visible = visible

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        photos: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    // Clear cache
    invalidateEventsCache()

    return NextResponse.json({
      id: updatedEvent.id,
      name: updatedEvent.name,
      date: updatedEvent.date,
      thumbnail: updatedEvent.thumbnail || '/placeholder.jpg',
      photos: updatedEvent.photos.map(photo => ({
        id: photo.id,
        url: photo.url
      })),
      visible: updatedEvent.visible
    })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE /api/admin/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin session
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const eventId = resolvedParams.id

    // Check if event exists
    const events = await getAllEvents()
    const eventExists = events.some((e: any) => e.id === eventId)

    if (!eventExists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Delete the event and all its photos
    await deleteEvent(eventId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
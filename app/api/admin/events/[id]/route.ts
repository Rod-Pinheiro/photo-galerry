import { NextRequest, NextResponse } from 'next/server'
import { getAllEvents, invalidateEventsCache } from '@/lib/photo-service'
import { saveEventMetadata, loadEventMetadata, deletePhoto } from '@/lib/minio'
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

    // Load current events
    const currentEvents = await getAllEvents()
    console.log('Current events count:', currentEvents.length)
    console.log('Event IDs:', currentEvents.map((e: any) => e.id))
    const eventIndex = currentEvents.findIndex((e: any) => e.id === eventId)
    console.log('Event index found:', eventIndex)

    if (eventIndex === -1) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Update event
    const updatedEvent = {
      ...currentEvents[eventIndex],
      ...(name !== undefined && { name }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(visible !== undefined && { visible })
    }

    currentEvents[eventIndex] = updatedEvent

    // Save updated events
    await saveEventMetadata(currentEvents)

    // Clear cache
    invalidateEventsCache()

    return NextResponse.json(updatedEvent)
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

    // Load current events
    const currentEvents = await loadEventMetadata()
    const filteredEvents = currentEvents.filter((e: any) => e.id !== eventId)

    if (filteredEvents.length === currentEvents.length) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Save updated events (without the deleted event)
    await saveEventMetadata(filteredEvents)

    // Clear cache
    invalidateEventsCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
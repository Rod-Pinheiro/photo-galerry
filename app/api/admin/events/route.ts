import { NextRequest, NextResponse } from 'next/server'
import { getAllEvents, createEvent } from '@/lib/photo-service'
import { saveEventMetadata, loadEventMetadata } from '@/lib/minio'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/admin/events - List all events (including hidden ones)
export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const events = await getAllEvents()
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST /api/admin/events - Create new event
export async function POST(request: NextRequest) {
  try {
    console.log('Creating new event...')
    // Verify admin session
    const session = await getSessionFromRequest(request)
    if (!session) {
      console.log('Unauthorized access')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, date: dateStr } = body
    console.log('Event data:', { name, dateStr })

    if (!name || !dateStr) {
      console.log('Missing required fields')
      return NextResponse.json({ error: 'Name and date are required' }, { status: 400 })
    }

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      console.log('Invalid date format')
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    console.log('Calling createEvent...')
    const event = await createEvent(name, date)
    console.log('Event created successfully:', event.id)
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
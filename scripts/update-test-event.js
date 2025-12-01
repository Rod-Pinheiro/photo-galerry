#!/usr/bin/env node

import { saveEventMetadata, loadEventMetadata } from '../lib/minio.ts'

async function updateTestEvent() {
  try {
    const currentEvents = await loadEventMetadata()
    console.log('Current events:', currentEvents.length)

    // Find and update the test event
    const updatedEvents = currentEvents.map(event => {
      if (event.id === 'teste') {
        return {
          ...event,
          id: 'TESTE',
          name: 'Evento TESTE'
        }
      }
      return event
    })

    await saveEventMetadata(updatedEvents)

    console.log('Test event updated successfully!')
  } catch (error) {
    console.error('Failed to update test event:', error)
  }
}

updateTestEvent()
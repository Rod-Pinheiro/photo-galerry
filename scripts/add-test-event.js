#!/usr/bin/env node

import { saveEventMetadata, loadEventMetadata } from '../lib/minio.ts'

async function addTestEvent() {
  try {
    const currentEvents = await loadEventMetadata()
    console.log('Current events:', currentEvents.length)

    const testEvent = {
      id: "teste",
      name: "Evento de Teste",
      date: new Date().toISOString(),
      thumbnail: "http://localhost:9000/photos/TESTE/Captura%20de%20tela%202025-11-22%20131419.png",
      photos: []
    }

    const updatedEvents = [...currentEvents, testEvent]
    await saveEventMetadata(updatedEvents)

    console.log('Test event added successfully!')
  } catch (error) {
    console.error('Failed to add test event:', error)
  }
}

addTestEvent()
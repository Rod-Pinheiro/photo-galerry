export interface Photo {
  id: string
  url: string
}

export interface Event {
  id: string
  name: string
  date: Date
  thumbnail: string
  photos: Photo[]
}

// Generate mock photo URLs using placeholder service
function generatePhotoUrl(eventId: string, photoIndex: number): string {
  const colors = ["FF6B6B", "4ECDC4", "45B7D1", "FFA07A", "98D8C8", "F7DC6F", "BB8FCE", "85C1E2"]
  const color = colors[(eventId.charCodeAt(0) + photoIndex) % colors.length]
  return `/placeholder.svg?height=400&width=400&query=foto_evento_${eventId}_${photoIndex}`
}

const MOCK_EVENTS: Event[] = [
  {
    id: "evento-1",
    name: "Casamento - Maria & João",
    date: new Date(2025, 0, 15),
    thumbnail: "/casamento.jpg",
    photos: Array.from({ length: 12 }, (_, i) => ({
      id: `photo-${i + 1}`,
      url: generatePhotoUrl("evento-1", i),
    })),
  },
  {
    id: "evento-2",
    name: "Formatura - Turma 2024",
    date: new Date(2024, 11, 20),
    thumbnail: "/formatura.jpg",
    photos: Array.from({ length: 15 }, (_, i) => ({
      id: `photo-${i + 1}`,
      url: generatePhotoUrl("evento-2", i),
    })),
  },
  {
    id: "evento-3",
    name: "Aniversário - Sofia 15 anos",
    date: new Date(2024, 10, 10),
    thumbnail: "/anivers-rio.jpg",
    photos: Array.from({ length: 18 }, (_, i) => ({
      id: `photo-${i + 1}`,
      url: generatePhotoUrl("evento-3", i),
    })),
  },
  {
    id: "evento-4",
    name: "Corporativo - Conferência Tech 2024",
    date: new Date(2024, 9, 5),
    thumbnail: "/corporativo.jpg",
    photos: Array.from({ length: 20 }, (_, i) => ({
      id: `photo-${i + 1}`,
      url: generatePhotoUrl("evento-4", i),
    })),
  },
  {
    id: "evento-5",
    name: "Batizado - Lucas",
    date: new Date(2024, 8, 22),
    thumbnail: "/batizado.jpg",
    photos: Array.from({ length: 10 }, (_, i) => ({
      id: `photo-${i + 1}`,
      url: generatePhotoUrl("evento-5", i),
    })),
  },
  {
    id: "evento-6",
    name: "Casamento - Pedro & Ana",
    date: new Date(2024, 7, 14),
    thumbnail: "/casamento.jpg",
    photos: Array.from({ length: 25 }, (_, i) => ({
      id: `photo-${i + 1}`,
      url: generatePhotoUrl("evento-6", i),
    })),
  },
]

// Sort events by date (newest first)
const SORTED_EVENTS = [...MOCK_EVENTS].sort((a, b) => b.date.getTime() - a.date.getTime())

export function getAllEvents(): Event[] {
  return SORTED_EVENTS
}

export function getEventById(id: string): Event | undefined {
  return SORTED_EVENTS.find((event) => event.id === id)
}

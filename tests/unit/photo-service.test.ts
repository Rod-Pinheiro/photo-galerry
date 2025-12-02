import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEvent, getEventById } from '@/lib/photo-service'

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn()
  }
}))

describe('photo-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createEvent', () => {
    it('should create an event with valid data', async () => {
      const mockDb = await import('@/lib/db')
      const mockQuery = vi.fn().mockResolvedValue({
        rows: [{
          id: 'test-event-id',
          name: 'Test Event',
          date: new Date('2024-12-01'),
          thumbnail: '/placeholder.jpg',
          visible: true
        }]
      })
      mockDb.db.query = mockQuery

      const result = await createEvent('Test Event', new Date('2024-12-01'))

      expect(result).toEqual({
        id: 'test-event-id',
        name: 'Test Event',
        date: expect.any(Date),
        thumbnail: '/placeholder.jpg',
        photos: [],
        visible: true
      })
      expect(mockQuery).toHaveBeenCalled()
    })
  })

  describe('getEventById', () => {
    it('should return undefined when event not found', async () => {
      const mockDb = await import('@/lib/db')
      const mockQuery = vi.fn().mockResolvedValue({
        rows: []
      })
      mockDb.db.query = mockQuery

      const result = await getEventById('non-existent-id')

      expect(result).toBeUndefined()
    })
  })
})
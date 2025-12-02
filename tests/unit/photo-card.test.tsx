import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhotoCard } from '@/components/photo-card'
import type { Photo } from '@/lib/photo-service'

const mockPhoto: Photo = {
  id: 'test-photo-1',
  filename: 'photo1.jpg',
  url: 'https://example.com/photo1.jpg'
}

describe('PhotoCard', () => {
  it('should render photo card with correct structure', () => {
    const mockOnToggle = vi.fn()
    const mockOnViewFullSize = vi.fn()

    render(
      <PhotoCard
        photo={mockPhoto}
        isSelected={false}
        onToggle={mockOnToggle}
        onViewFullSize={mockOnViewFullSize}
      />
    )

    const photoCard = screen.getByRole('button', { name: 'Foto photo1.jpg' })
    expect(photoCard).toBeInTheDocument()
  })

  it('should show selected state correctly', () => {
    const mockOnToggle = vi.fn()
    const mockOnViewFullSize = vi.fn()

    render(
      <PhotoCard
        photo={mockPhoto}
        isSelected={true}
        onToggle={mockOnToggle}
        onViewFullSize={mockOnViewFullSize}
      />
    )

    const photoCard = screen.getByRole('button', { name: 'Foto photo1.jpg (selecionada)' })
    expect(photoCard).toHaveClass('ring-2', 'ring-blue-600')
  })
})
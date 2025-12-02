import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from '@/components/header'

describe('Header', () => {
  it('should render the header with correct title and description', () => {
    render(<Header />)

    expect(screen.getByText('Galeria de Eventos')).toBeInTheDocument()
    expect(screen.getByText('Visualize, selecione e baixe fotos dos seus eventos')).toBeInTheDocument()
  })

  it('should have correct structure', () => {
    const { container } = render(<Header />)

    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('sticky', 'top-0', 'z-50')
  })
})
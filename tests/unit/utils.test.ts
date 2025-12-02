import { describe, it, expect } from 'vitest'
import { cn, formatDate } from '@/lib/utils'

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2')
  })

  it('should merge conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('formatDate', () => {
  it('should format date in Portuguese locale', () => {
    const date = new Date(2024, 11, 25) // December 25, 2024
    const result = formatDate(date)
    expect(result).toBe('25 de dezembro de 2024')
  })

  it('should handle different dates correctly', () => {
    const date = new Date(2023, 0, 1) // January 1, 2023
    const result = formatDate(date)
    expect(result).toBe('1 de janeiro de 2023')
  })
})
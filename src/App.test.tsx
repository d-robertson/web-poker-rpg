import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders navigation', () => {
    render(<App />)
    expect(screen.getByText('Play Game')).toBeInTheDocument()
    expect(screen.getByText('Casino')).toBeInTheDocument()
    expect(screen.getByText('Hand Evaluator')).toBeInTheDocument()
  })

  it('renders poker game by default', () => {
    render(<App />)
    expect(screen.getByText('Texas Hold\'em')).toBeInTheDocument()
  })
})

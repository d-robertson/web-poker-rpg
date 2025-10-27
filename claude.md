# Web Poker RPG - Project Guidelines

## Project Overview

This project uses modern web technologies to create a web-based poker game. We are committed to following modern web development standards and best practices.

## Development Principles

- **Quality over Speed**: Always choose the correct approach, even when it's more difficult. Never cut corners.
- **Modern Standards**: Follow current web development best practices and conventions.
- **Test-Driven Development**: Create frontend tests for each feature to verify functionality.
- **Incremental Development**: Break down tasks into their smallest logical parts with clear goals.

## Architecture & Components

The game follows a modular architecture where each component manages its own state and responsibilities:

### 1. Casino
- Manages multiple poker tables
- Provides table selection interface
- Has a cashier system to exchange cash for chips

### 2. Table
- Contains seats for players
- Has a dealer
- Manages the pot
- Displays community cards
- Orchestrates the game flow

### 3. Player
- Has a chip stack
- Holds hole cards
- Can perform actions (fold, check, bet, raise, call)

### 4. Dealer
- Deals cards to players
- Distributes chips (pots and winnings)
- Manages the dealer button position
- Works directly with the poker engine to execute game logic

### 5. Deck
- Contains and manages 52 playing cards
- Handles shuffling and card distribution

### 6. Card
- Has a rank (value)
- Has a suit
- Has a description

### 7. Chip
- Has a denomination (value)
- Has a color
- Has a description

### 8. Poker Engine
- **Core component**: Handles all poker-related logic
- Evaluates hand rankings
- Determines win conditions
- Manages betting rounds
- Calculates pot distribution

## Development Approach

### Phase 1: Basic UI Setup
- Create a minimal, functional UI for testing purposes
- Focus on functionality over aesthetics
- UI should allow manual testing of each poker engine feature
- Polish and enhance UI in later phases

### Phase 2: Game Logic Development
- Focus primarily on poker engine implementation
- Ensure robust, correct game logic
- Build each component according to the architecture above

### Phase 3: UI Enhancement
- Refine visual design
- Add animations and polish
- Improve user experience

## Testing Strategy

For each feature developed:
1. Define clear, measurable goals for the feature
2. Implement the feature following best practices
3. Create a frontend test that allows manual verification
4. Verify the feature works as intended before moving forward

## Current Status

Project is in initial setup phase.

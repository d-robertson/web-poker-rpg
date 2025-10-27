# Web Poker RPG - Implementation Plan

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (with React Context as fallback)
- **Styling**: Tailwind CSS
- **Testing**: Vitest + React Testing Library
- **Package Manager**: npm/pnpm

---

## Phase 0: Project Setup

### Task 0.1: Initialize Project
- [ ] Create Vite + React + TypeScript project
- [ ] Install and configure Tailwind CSS
- [ ] Set up project folder structure
- [ ] Configure TypeScript (strict mode)
- [ ] Set up ESLint and Prettier

### Task 0.2: Testing Infrastructure
- [ ] Install and configure Vitest
- [ ] Install React Testing Library
- [ ] Create example test to verify setup
- [ ] Document testing conventions

### Task 0.3: Project Structure
Create folder structure:
```
src/
├── components/        # React components
│   ├── Casino/
│   ├── Table/
│   ├── Player/
│   ├── Dealer/
│   └── UI/           # Shared UI components
├── engine/           # Game logic (framework-agnostic)
│   ├── PokerEngine.ts
│   ├── HandEvaluator.ts
│   └── BettingEngine.ts
├── models/           # TypeScript types and classes
│   ├── Card.ts
│   ├── Deck.ts
│   ├── Chip.ts
│   ├── Player.ts
│   └── Table.ts
├── store/            # State management
├── utils/            # Helper functions
└── tests/            # Test files
```

---

## Phase 1: Core Models & Types

### Task 1.1: Card Model
- [ ] Create Card type/class with rank and suit
- [ ] Define all ranks (2-A) and suits (♠♥♦♣)
- [ ] Implement card comparison logic
- [ ] Write unit tests for Card
- [ ] Create basic UI component to display a card

### Task 1.2: Deck Model
- [ ] Create Deck class with 52 cards
- [ ] Implement shuffle algorithm (Fisher-Yates)
- [ ] Implement deal/draw card methods
- [ ] Implement reset/rebuild deck
- [ ] Write unit tests for Deck
- [ ] Create UI test page to visualize deck operations

### Task 1.3: Chip Model
- [ ] Define chip denominations and colors
- [ ] Create Chip type/class
- [ ] Implement chip stack utilities (count total, make change)
- [ ] Write unit tests for Chip
- [ ] Create basic UI component to display chips

### Task 1.4: Player Model
- [ ] Create Player class with name, chips, and cards
- [ ] Implement player actions enum (fold, check, call, bet, raise)
- [ ] Implement chip management methods
- [ ] Implement hand management (receive cards, fold)
- [ ] Write unit tests for Player
- [ ] Create basic Player UI component

---

## Phase 2: Poker Engine - Hand Evaluation

### Task 2.1: Hand Ranking System
- [ ] Define hand ranking enum (High Card → Royal Flush)
- [ ] Create hand ranking type definitions
- [ ] Write unit tests with example hands for each ranking

### Task 2.2: Hand Evaluator - Part 1 (Basic Hands)
- [ ] Implement High Card evaluation
- [ ] Implement Pair detection
- [ ] Implement Two Pair detection
- [ ] Implement Three of a Kind detection
- [ ] Write comprehensive tests for basic hands
- [ ] Create UI test page to input 5 cards and see ranking

### Task 2.3: Hand Evaluator - Part 2 (Advanced Hands)
- [ ] Implement Straight detection
- [ ] Implement Flush detection
- [ ] Implement Full House detection
- [ ] Implement Four of a Kind detection
- [ ] Write comprehensive tests for advanced hands
- [ ] Update UI test page with new hand types

### Task 2.4: Hand Evaluator - Part 3 (Premium Hands)
- [ ] Implement Straight Flush detection
- [ ] Implement Royal Flush detection
- [ ] Write comprehensive tests for premium hands
- [ ] Update UI test page with all hand types

### Task 2.5: Hand Comparison
- [ ] Implement hand vs hand comparison logic
- [ ] Handle kicker evaluation for tie-breaking
- [ ] Implement split pot detection (true ties)
- [ ] Write extensive comparison tests
- [ ] Create UI test page to compare two hands

### Task 2.6: 7-Card Hand Evaluation (Texas Hold'em)
- [ ] Implement best 5-card hand from 7 cards
- [ ] Test with 2 hole cards + 5 community cards
- [ ] Write comprehensive tests
- [ ] Create UI test page for full Texas Hold'em scenarios

---

## Phase 3: Poker Engine - Betting Logic

### Task 3.1: Betting Round Structure
- [ ] Define betting round enum (Preflop, Flop, Turn, River)
- [ ] Create betting round state management
- [ ] Implement action tracking (who has acted)
- [ ] Write unit tests

### Task 3.2: Pot Management
- [ ] Create Pot class for main pot
- [ ] Implement add to pot, distribute pot methods
- [ ] Write unit tests
- [ ] Create UI component to display pot

### Task 3.3: Side Pot Logic
- [ ] Implement side pot creation for all-in scenarios
- [ ] Implement multi-way side pot logic
- [ ] Calculate player eligibility for each pot
- [ ] Write complex all-in scenario tests
- [ ] Create UI visualization for multiple pots

### Task 3.4: Betting Actions
- [ ] Implement fold logic
- [ ] Implement check logic
- [ ] Implement call logic
- [ ] Implement bet logic
- [ ] Implement raise logic (min/max raise rules)
- [ ] Implement all-in logic
- [ ] Write tests for each action
- [ ] Create UI test page for betting scenarios

### Task 3.5: Betting Round Completion
- [ ] Detect when betting round is complete
- [ ] Handle all-in situations
- [ ] Handle everyone-folded scenarios
- [ ] Write tests for round completion logic

---

## Phase 4: Table & Dealer Logic

### Task 4.1: Table Model
- [ ] Create Table class with seats (e.g., 6 or 9 seats)
- [ ] Implement seat assignment/removal
- [ ] Track dealer button position
- [ ] Track small blind and big blind positions
- [ ] Write unit tests
- [ ] Create basic Table UI component

### Task 4.2: Dealer - Card Distribution
- [ ] Implement deal hole cards to players
- [ ] Implement deal flop (3 cards)
- [ ] Implement deal turn (1 card)
- [ ] Implement deal river (1 card)
- [ ] Implement burn cards
- [ ] Write unit tests
- [ ] Create UI visualization for dealing

### Task 4.3: Dealer - Button Management
- [ ] Implement dealer button rotation
- [ ] Implement blind position calculation
- [ ] Handle heads-up blind rules
- [ ] Write unit tests

### Task 4.4: Dealer - Pot Distribution
- [ ] Implement winner determination using hand evaluator
- [ ] Implement pot distribution to winner(s)
- [ ] Handle side pot distribution
- [ ] Handle chip rounding (odd chips)
- [ ] Write complex distribution tests
- [ ] Create UI visualization for pot distribution

---

## Phase 5: Game Flow Integration

### Task 5.1: Game State Machine
- [ ] Define game states (Waiting, Dealing, Preflop, Flop, Turn, River, Showdown, Complete)
- [ ] Implement state transitions
- [ ] Write state machine tests

### Task 5.2: Complete Hand Orchestration
- [ ] Integrate all components for a full hand
- [ ] Post blinds
- [ ] Deal hole cards
- [ ] Execute betting round (preflop)
- [ ] Deal flop + betting round
- [ ] Deal turn + betting round
- [ ] Deal river + betting round
- [ ] Showdown and pot distribution
- [ ] Write end-to-end hand tests

### Task 5.3: Multi-Hand Game
- [ ] Reset table for next hand
- [ ] Rotate button
- [ ] Handle player elimination (no chips)
- [ ] Write multi-hand game tests

---

## Phase 6: Casino & Table Selection

### Task 6.1: Casino Model
- [ ] Create Casino class to manage multiple tables
- [ ] Implement table creation
- [ ] Implement table list/selection
- [ ] Write unit tests

### Task 6.2: Cashier System
- [ ] Implement buy-in logic (cash → chips)
- [ ] Implement cash-out logic (chips → cash)
- [ ] Track player bankroll
- [ ] Write unit tests
- [ ] Create Cashier UI component

### Task 6.3: Casino UI
- [ ] Create table selection screen
- [ ] Create cashier interface
- [ ] Create navigation between casino and tables

---

## Phase 7: State Management & UI Integration

### Task 7.1: Zustand Store Setup
- [ ] Install Zustand
- [ ] Create game state store
- [ ] Create player state store
- [ ] Create table state store
- [ ] Integrate with existing models

### Task 7.2: Complete Table UI
- [ ] Build full table component
- [ ] Display all players with chips and cards
- [ ] Display community cards
- [ ] Display pot(s)
- [ ] Display dealer button and blinds
- [ ] Show current player to act
- [ ] Create action buttons (fold, check, call, bet, raise)

### Task 7.3: Player Interaction
- [ ] Implement click handlers for player actions
- [ ] Add bet sizing controls (slider or buttons)
- [ ] Add input validation
- [ ] Show player feedback (invalid actions, etc.)

### Task 7.4: Game Flow UI
- [ ] Animate card dealing
- [ ] Animate chip movements
- [ ] Show betting round transitions
- [ ] Show winner announcement
- [ ] Show hand rankings at showdown

---

## Phase 8: AI/NPC Players (GTO-Based)

**Note**: This is a single-player game, so AI opponents are essential. AI decision-making is based on Game Theory Optimal (GTO) strategy, with skill levels determined by adherence to GTO charts.

### Task 8.1: GTO Foundation Research
- [ ] Research and document GTO poker principles
- [ ] Identify key GTO decision points (preflop ranges, continuation betting, etc.)
- [ ] Find or create GTO charts for Texas Hold'em
- [ ] Document range-based decision making
- [ ] Plan variance/deviation system for skill levels

### Task 8.2: AI Player Model
- [ ] Create AIPlayer class extending Player
- [ ] Define skill level enum (Beginner, Amateur, Intermediate, Advanced, Expert, GTO-Perfect)
- [ ] Implement personality traits (tight/loose, passive/aggressive)
- [ ] Add variance parameters based on skill level
- [ ] Write unit tests for AI player model

### Task 8.3: Preflop Decision Engine
- [ ] Implement GTO preflop hand ranges by position
- [ ] Create range charts (early position, middle position, late position, blinds)
- [ ] Implement 3-bet and 4-bet ranges
- [ ] Add skill-based deviation from optimal ranges
- [ ] Write tests for preflop decisions
- [ ] Create UI test page to visualize AI preflop decisions

### Task 8.4: Postflop Decision Engine - Part 1
- [ ] Implement board texture analysis (dry, wet, coordinated)
- [ ] Implement hand strength evaluation (top pair, draws, etc.)
- [ ] Create continuation betting logic based on GTO
- [ ] Implement bet sizing (GTO-based sizing by situation)
- [ ] Write tests for basic postflop scenarios

### Task 8.5: Postflop Decision Engine - Part 2
- [ ] Implement turn and river decision trees
- [ ] Add bluffing frequency based on GTO
- [ ] Add value betting logic
- [ ] Implement pot odds and equity calculations
- [ ] Add fold equity considerations
- [ ] Write tests for advanced postflop scenarios

### Task 8.6: Opponent Modeling (Advanced AI)
- [ ] Track opponent statistics (VPIP, PFR, aggression factor)
- [ ] Implement exploitative adjustments for higher-level AI
- [ ] Add hand reading logic based on betting patterns
- [ ] Adjust strategy based on opponent tendencies
- [ ] Write tests for exploitative play

### Task 8.7: Skill Level Implementation
- [ ] Implement variance system for each skill level:
  - **GTO-Perfect**: 95-100% adherence to GTO
  - **Expert**: 85-95% adherence, slight exploitative adjustments
  - **Advanced**: 70-85% adherence, some mistakes
  - **Intermediate**: 50-70% adherence, regular mistakes
  - **Amateur**: 30-50% adherence, frequent mistakes, predictable patterns
  - **Beginner**: 0-30% adherence, plays based on hand strength only, major mistakes
- [ ] Add randomization for sub-optimal plays based on skill
- [ ] Test each skill level's decision quality
- [ ] Create UI test page to compare different AI skill levels

### Task 8.8: AI Personality & Behavior
- [ ] Implement playing styles (tight-aggressive, loose-aggressive, tight-passive, loose-passive)
- [ ] Add timing variations (fast vs slow decisions)
- [ ] Add occasional "tells" for lower-skilled AI
- [ ] Implement tilt mechanics for lower-skilled AI (after bad beats)
- [ ] Write tests for personality traits

### Task 8.9: AI Integration with Game
- [ ] Integrate AI players into table management
- [ ] Implement AI action selection during game flow
- [ ] Add AI thinking/decision delay for realism
- [ ] Test full table with multiple AI players
- [ ] Create UI to display AI difficulty levels
- [ ] Add debug mode to show AI decision reasoning

### Task 8.10: AI Balancing & Testing
- [ ] Run simulation tests (1000+ hands per skill level)
- [ ] Analyze AI profitability by skill level
- [ ] Tune variance and deviation parameters
- [ ] Ensure appropriate win rates for each skill level
- [ ] Create AI performance dashboard for testing

---

## Phase 9: Polish & Additional Features

### Task 9.1: UI Enhancement
- [ ] Improve card visuals
- [ ] Improve chip visuals
- [ ] Add table felt styling
- [ ] Add responsive design
- [ ] Add animations and transitions

### Task 9.2: Game Settings
- [ ] Configurable blind levels
- [ ] Configurable starting chips
- [ ] Configurable number of seats
- [ ] Configurable AI difficulty levels
- [ ] Game speed controls

### Task 9.3: Player Experience
- [ ] Add sound effects (optional)
- [ ] Add game history/log
- [ ] Add hand replay
- [ ] Add statistics tracking
- [ ] Add achievements system

---

## Phase 10: RPG Elements

**Note**: This phase requires Derek's plan and detailed rules for RPG mechanics.

### Task 10.1: RPG System Design
- [ ] Review and document Derek's RPG rules
- [ ] Define RPG mechanics integration with poker gameplay
- [ ] Create architecture plan for RPG systems
- [ ] Identify new models and components needed

### Task 10.2: RPG Implementation
- [ ] To be defined based on Derek's plan
- [ ] Tasks will be added once requirements are provided

### Task 10.3: RPG Testing
- [ ] Create test scenarios for RPG mechanics
- [ ] Integrate RPG features with existing poker game
- [ ] Create UI test pages for RPG elements

---

## Testing Milestones

After each major phase, create a comprehensive test page:

1. **Phase 1 Complete**: Test page showing all models working independently
2. **Phase 2 Complete**: Test page for hand evaluation (input any 5-7 cards, see ranking)
3. **Phase 3 Complete**: Test page for betting scenarios (simulate betting rounds)
4. **Phase 4 Complete**: Test page for full table with dealer actions
5. **Phase 5 Complete**: Playable single-hand game
6. **Phase 6 Complete**: Full casino with table selection
7. **Phase 7 Complete**: Fully interactive game
8. **Phase 8 Complete**: AI players with GTO-based decision making at all skill levels
9. **Phase 9 Complete**: Polished, production-ready game
10. **Phase 10 Complete**: Full poker RPG with integrated game mechanics

---

## Current Status

- [ ] Phase 0: Project Setup
- [ ] Phase 1: Core Models & Types
- [ ] Phase 2: Poker Engine - Hand Evaluation
- [ ] Phase 3: Poker Engine - Betting Logic
- [ ] Phase 4: Table & Dealer Logic
- [ ] Phase 5: Game Flow Integration
- [ ] Phase 6: Casino & Table Selection
- [ ] Phase 7: State Management & UI Integration
- [ ] Phase 8: AI/NPC Players (GTO-Based)
- [ ] Phase 9: Polish & Additional Features
- [ ] Phase 10: RPG Elements (requires Derek's plan)

---

## Notes

- Each task should have associated unit tests before moving to the next
- Each phase should have a working UI test page for manual verification
- Commit after completing each task
- Update this document as we progress and learn
- Add new tasks as we discover requirements

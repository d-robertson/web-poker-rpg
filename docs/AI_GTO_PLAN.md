# GTO-Based AI Implementation Plan

## Overview
Implement AI players that make poker decisions based on GTO (Game Theory Optimal) ranges with varying skill levels.

## Goals
- AI players base decisions on realistic GTO ranges
- Skill level = adherence percentage to GTO (0-100%)
- Support cash game play for all table sizes (2-9 players)
- Full implementation for all streets: preflop, flop, turn, river

## Architecture

### Components
1. **GTOTypes** - Type definitions and enums
2. **HandRangeParser** - Parse hand notation (AA, KK, AKs, etc.)
3. **GTORanges** - GTO range data for all positions
4. **GTOEngine** - Decision engine using GTO ranges
5. **AIPlayer** - Updated to use GTOEngine

### Data Flow
```
Player Situation → GTOEngine → Check GTO Range → Apply Skill Level → Return Action
```

## Implementation Phases

### Phase 1: Foundation (Current)
- [x] Create GTO type definitions
- [ ] Implement hand notation parser
- [ ] Create hand comparison utilities

### Phase 2: Preflop Ranges
- [ ] Define opening ranges by position (6-max and full ring)
- [ ] Define 3-bet/4-bet ranges
- [ ] Define calling ranges vs raises
- [ ] Handle heads-up adjustments

### Phase 3: Postflop Strategy
- [ ] Hand strength evaluation system
- [ ] Board texture analysis
- [ ] Continuation bet frequencies
- [ ] Check-raise/call/fold frequencies
- [ ] Bet sizing guidelines

### Phase 4: Skill System
- [ ] Implement adherence system
- [ ] Implement deviation behaviors (passive/aggressive/random)
- [ ] Assign fixed skill levels to AI players

### Phase 5: Integration & Testing
- [ ] Replace current AIPlayer logic with GTOEngine
- [ ] Test at different skill levels
- [ ] Verify realistic play patterns
- [ ] Balance aggression and action

## Skill Levels

| Level | Adherence | Behavior | Description |
|-------|-----------|----------|-------------|
| Beginner | 45% | Passive | Checks/calls too much, folds too often |
| Intermediate | 65% | Random | Mix of correct and incorrect plays |
| Advanced | 80% | Aggressive | Mostly correct with occasional overbet/bluff |
| Expert | 92% | Random | Near-optimal with rare mistakes |
| Perfect | 100% | N/A | Always follows GTO (for testing) |

## AI Player Assignments (Fixed)

- **Alice**: Advanced (80% adherence)
- **Bob**: Intermediate (65% adherence)
- **Charlie**: Beginner (45% adherence)

## GTO Ranges Overview

### Preflop Opening Ranges (6-max)
- **UTG**: ~15% (99+, AJs+, KQs, AQo+)
- **MP**: ~20% (77+, A9s+, KTs+, QJs, AJo+, KQo)
- **CO**: ~28% (66+, A7s+, K9s+, QTs+, JTs, A9o+, KJo+)
- **BTN**: ~45% (22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 98s, A8o+, KTo+, QJo)
- **SB**: ~35% (similar to CO but adjusted for position)
- **BB**: Defend ~40-50% vs BTN open

### Postflop Guidelines
- **C-bet frequency**: 60-70% on dry boards, 40-50% on wet boards
- **Hand strength categories**: Evaluate based on equity vs opponent range
- **Bet sizing**: 33% pot (small), 66% pot (medium), 100% pot (large)

## Technical Notes

### Hand Notation
- Pairs: AA, KK, QQ, ... 22
- Suited: AKs, KQs, QJs, etc.
- Offsuit: AKo, KQo, etc.
- Ranges: 99+ (all pairs 99 or better), ATs+ (AT through AK suited)

### Position Mapping
- Need to map table positions to GTO positions
- Handle different table sizes (2-9 players)
- Adjust ranges for short-handed play

## Success Criteria
- [ ] AI makes realistic preflop decisions
- [ ] AI adjusts strategy by position
- [ ] AI plays differently based on skill level
- [ ] Lower skill AI makes exploitable mistakes
- [ ] Higher skill AI approximates GTO play
- [ ] Game remains engaging and challenging

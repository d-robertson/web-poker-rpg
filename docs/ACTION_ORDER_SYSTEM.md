# Action Order System - Architecture

## Problem We Solved

The original `BettingRoundTracker` had complex nested conditional logic spread throughout `initializeActionOrder()` with ~100 lines of conditions handling:
- Preflop vs post-flop
- Heads-up vs 3+ players
- Finding UTG
- Rotating button position
- Multiple edge cases

This was hard to:
- Understand
- Maintain
- Test
- Verify correctness

## New Solution: Rules-Based Architecture

### 1. **Centralized Rules** (`ActionOrderRules.ts`)

All action order logic is now in **one place** with clear documentation:

```typescript
/**
 * PREFLOP ACTION ORDER
 * Rules:
 * - 2 players: SB acts first (SB is also button in heads-up)
 * - 3+ players: Player immediately left of BB acts first (UTG)
 * - Action continues clockwise
 * - BB acts last (gets option to raise)
 */

/**
 * POST-FLOP ACTION ORDER (Flop, Turn, River)
 * Rules:
 * - First active player left of button acts first
 * - Action continues clockwise
 * - Button acts last (best position)
 */
```

### 2. **Single Entry Point**

```typescript
const orderResult = ActionOrderRules.getActionOrder(table, street)
// Returns: { playerOrder: string[], startingBet: number }
```

All action order determination goes through this one method.

### 3. **Simplified Tracker** (`BettingRoundTracker`)

The tracker is now **simple and focused**:

**Before:** 100+ lines of complex conditional logic
**After:** 10 lines calling the rules system

```typescript
private initializeActionOrder(): void {
  const street = toStreet(this.round)
  const orderResult = ActionOrderRules.getActionOrder(this.table, street)

  this.playerIdOrder = orderResult.playerOrder
  this.currentBetAmount = orderResult.startingBet
}
```

## Benefits

### ✅ Easy to Understand
- Rules are documented with clear comments
- Separate methods for preflop vs post-flop
- No nested conditionals to parse

### ✅ Easy to Maintain
- Change action order rules in **one place**
- Add new betting streets easily
- No need to trace through complex logic

### ✅ Easy to Test
- Test rules independently of tracker
- Validation methods built-in
- Explanation methods for debugging

### ✅ Easy to Verify
- Rules match poker documentation exactly
- Can compare directly to `/docs/POKER_POSITIONS_AND_ORDER.md`
- Built-in validation: `validateActionOrder()`

## Usage Examples

### Getting Action Order
```typescript
const order = ActionOrderRules.getActionOrder(table, BettingStreet.Preflop)
// order.playerOrder = ['player1', 'player2', 'player3']
// order.startingBet = 10 (BB amount)
```

### Validating Order (Testing)
```typescript
const isValid = ActionOrderRules.validateActionOrder(
  table,
  BettingStreet.Flop,
  ['BB', 'Button']
)
```

### Debugging
```typescript
const explanation = ActionOrderRules.explainActionOrder(table, street)
console.log(explanation)
// Output:
// PREFLOP Action Order:
//   1. Charlie (UTG)
//   2. You (Button)
//   3. Alice (SB)
//   4. Bob (BB)
// Starting bet: $10
```

## File Structure

```
src/engine/
├── ActionOrderRules.ts      # ⭐ All action order rules
├── BettingStructure.ts       # Uses ActionOrderRules
└── HandManager.ts            # Uses BettingRoundTracker
```

## How It Works

```
User Action
    ↓
HandManager
    ↓
BettingRoundTracker.getCurrentPlayer()
    ↓
(initialized with)
    ↓
ActionOrderRules.getActionOrder()
    ↓
Returns ordered player IDs based on:
  - Betting street (preflop/flop/turn/river)
  - Button position
  - Active players
  - Poker rules
```

## Adding New Rules

To add new action order rules (e.g., for a tournament format):

1. **Add new street type** in `ActionOrderRules.ts`
2. **Add method** like `getTournamentOrder()`
3. **Update** `getActionOrder()` to call your new method
4. **Document** the rules with clear comments

No need to modify `BettingRoundTracker` or any other code!

## Testing

The rules system includes built-in testing utilities:

```typescript
// Validate expected order
ActionOrderRules.validateActionOrder(table, street, expectedOrder)

// Get explanation for debugging
ActionOrderRules.explainActionOrder(table, street)
```

## Debugging Output

The tracker automatically logs action order (outside of tests):

```
🎯 PREFLOP action order: Charlie → You → Alice → Bob
🎯 FLOP action order: Bob → You
```

This makes it easy to verify the order is correct at runtime.

## Summary

**Before:** Complex, hard-to-maintain conditional logic
**After:** Simple, declarative rules system

- ✅ All **380 tests pass**
- ✅ **Easier to understand** - rules in one place
- ✅ **Easier to maintain** - change rules, not algorithms
- ✅ **Easier to verify** - matches poker documentation exactly
- ✅ **Better debugging** - built-in validation and explanation

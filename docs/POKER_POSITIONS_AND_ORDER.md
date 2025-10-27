# Poker Positions and Order of Operations

## Table Positions (9-max table)

Positions are named based on their relationship to the **Button** (dealer position):

### Position Names (clockwise from button)

1. **Button (BTN)** - Has the dealer button
2. **Small Blind (SB)** - One seat left of button
3. **Big Blind (BB)** - Two seats left of button (one left of SB)
4. **Under the Gun (UTG)** - Three seats left of button (first to act preflop)
5. **Under the Gun +1 (UTG+1)** - Four seats left of button
6. **Middle Position (MP)** - Five seats left of button
7. **Lojack (LJ)** - Six seats left of button
8. **Hijack (HJ)** - Seven seats left of button (two seats right of button)
9. **Cutoff (CO)** - Eight seats left of button (one seat right of button)

### Position Categories

- **Early Position**: SB, BB, UTG, UTG+1
- **Middle Position**: MP, LJ
- **Late Position**: HJ, CO, BTN

## Order of Operations for a Poker Hand

### Pre-Hand Setup

1. **Button Placement**: Dealer button is placed in front of one player
2. **Post Blinds**:
   - Small Blind posts (player to the left of button)
   - Big Blind posts (player to the left of small blind)

### Dealing

3. **Deal Hole Cards**: Each player receives 2 cards face down, starting from SB and going clockwise

### Preflop Betting Round

4. **Action Starts at UTG** (player to the left of BB)
5. **Action Order (clockwise)**:
   - UTG → UTG+1 → MP → LJ → HJ → CO → BTN → SB → BB
6. **Action Continues** until all players have either:
   - Folded
   - Called the current bet
   - Are all-in

**Special Preflop Rules:**
- In **heads-up** (2 players only):
  - SB is also the Button
  - SB acts first preflop
  - BB acts first post-flop
- In **3+ players**:
  - Action starts at UTG (left of BB)
  - BB acts last preflop (can check if no raise)

### Post-Flop Betting Rounds

7. **Deal Flop**: Three community cards dealt face-up
8. **Flop Betting Round**:
   - **Action starts at first active player left of button** (usually SB if still in)
   - Action goes clockwise: SB → BB → UTG → UTG+1 → MP → LJ → HJ → CO → BTN
   - First player can check or bet
   - Action continues until all match the current bet

9. **Deal Turn**: Fourth community card dealt face-up
10. **Turn Betting Round**: Same order as flop (first active player left of button acts first)

11. **Deal River**: Fifth community card dealt face-up
12. **River Betting Round**: Same order as flop and turn

### Showdown

13. **Show Cards**:
    - Last aggressor (last to bet/raise) shows first
    - Or, if no betting on river, first active player left of button shows first
14. **Determine Winner**: Best 5-card hand wins
15. **Award Pot**: Winner(s) receive chips

### Hand Complete

16. **Button Moves**: Dealer button moves one seat clockwise
17. **Next Hand Begins**: Return to step 1

## Action Order Summary

### Preflop (3+ players)
**UTG → UTG+1 → MP → LJ → HJ → CO → BTN → SB → BB**

### Preflop (Heads-up)
**SB/BTN → BB**

### Post-Flop (All streets: Flop, Turn, River)
**SB → BB → UTG → UTG+1 → MP → LJ → HJ → CO → BTN**

(Action starts at first active player left of button and goes clockwise)

## Key Differences: Preflop vs Post-Flop

- **Preflop**: Action starts **left of BB** (UTG), BTN acts near last, SB and BB act last
- **Post-Flop**: Action starts **left of Button** (SB), Button acts last

This is because:
- Preflop: SB and BB have already invested chips (forced bets), so they get to act last
- Post-flop: Button position is most advantageous, always acts last

## Visual Example (6-max table)

```
        [BB]
    [SB]    [UTG]
[BTN]          [MP]
    [CO]  [HJ]
```

**Button Indicator**: A white chip or disk marked "D" or "Dealer" sits in front of the button player.

### Preflop Action Order (6-max):
UTG → MP → HJ → CO → BTN → SB → BB

### Post-Flop Action Order (6-max):
SB → BB → UTG → MP → HJ → CO → BTN

## Implementation Notes

For our game implementation:

1. **Button Visual**: Display a white/gold "D" chip next to the button player
2. **Blind Posting**: Automatically deduct chips from SB and BB before dealing
3. **Action Indicator**: Highlight the player whose turn it is
4. **Turn Timer**: Show who needs to act with a visual indicator
5. **Position Labels**: Display position names (UTG, CO, BTN, etc.) on the table

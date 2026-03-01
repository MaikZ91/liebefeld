

## Problem

In `SpontanButton.tsx` line 93, active users are sliced to 6 (`real.slice(0, 6)`) before being stored in state, but `activeCount` is set to `real.length` (the unsliced total). This causes a mismatch: "9 HEUTE AKTIV" is displayed while only 6 user chips are rendered.

## Fix

Remove the `.slice(0, 6)` limit on line 93 so all active users are stored and displayed. The count and the visible list will then match.

**File**: `src/components/tribe/SpontanButton.tsx`
- Line 93: Change `setActiveUsers(real.slice(0, 6))` to `setActiveUsers(real)`


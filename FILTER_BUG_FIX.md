# Filter Bug Fix - Assigned To Parameter Issue

## Issue Description
When selecting "All Assignments" from the Assigned To dropdown filter, the API was still being called with `assigned_to=8` parameter instead of omitting it.

### User Report
- Selected "All Assignments" option
- Expected: API call without `assigned_to` parameter
- Actual: API call still included `assigned_to=8`

## Root Cause
**Type Inconsistency in Dropdown Values**

In `frontend/src/pages/PermitList.js` (line 454), the dropdown options for assigned users had numeric values:

```jsx
// BEFORE (Incorrect)
{assignedUsers.map((user) => (
  <option key={user.id} value={user.id}>  {/* value is NUMBER */}
    {user.full_name} ({user.role.toUpperCase()})
  </option>
))}
```

While the state and other parts of the code used STRING values:
- Line 189-195: `setAssignedFilter(String(user.id))` - string
- Line 116-120: Filter logic checks `assignedFilter !== 'all'` - expects string

This type mismatch caused React's controlled component behavior to fail:
1. When dropdown value selected: `8` (number) vs state `'8'` (string)
2. React couldn't properly update the component value
3. The selected value didn't change when user clicked "All Assignments"

## Solution Applied

### File Changed
`/Users/waqaskhan/Documents/PTA_RTA/frontend/src/pages/PermitList.js`

### Change Made
Convert dropdown values to strings:

```jsx
// AFTER (Correct)
{assignedUsers.map((user) => (
  <option key={user.id} value={String(user.id)}>  {/* value is STRING */}
    {user.full_name} ({user.role.toUpperCase()})
  </option>
))}
```

### Why This Works
Now all values are consistently strings:
- `"all"` - All Assignments option
- `"unassigned"` - Unassigned option
- `"8"` - User selection (now string, not number)

With consistent types, React's controlled component system works properly:
1. User selects "All Assignments"
2. onChange event fires with `value="all"`
3. `setAssignedFilter("all")` updates state correctly
4. Filter logic skips adding `assigned_to` parameter (due to line 118: `if (assignedFilter && assignedFilter !== 'all')`)
5. API called without `assigned_to` parameter ✓

## Testing Steps

1. **Start frontend:**
   ```bash
   cd /frontend && npm start
   ```

2. **Login and test filter:**
   - User logs in as `waqas409`
   - Click "Assigned To" dropdown
   - Default shows: `"All Assignments"`
   - Try selecting a specific user, then click "All Assignments"
   - Verify API URL in DevTools Network tab:
     - ✓ Correct: `http://localhost:8000/api/permits/?page=1&page_size=20&t=...&authority=RTA`
     - ✗ Wrong: `http://localhost:8000/api/permits/?page=1&page_size=20&t=...&authority=RTA&assigned_to=8`

3. **Verify all filter combinations work:**
   - All Assignments + All Status
   - Specific User + Specific Status
   - Unassigned permits option
   - Search term combinations

## Impact
- ✅ Default view shows all permits without forced assignment filter
- ✅ Users can now properly filter by "All Assignments"
- ✅ Type consistency prevents future React component issues
- ✅ No backend changes required

## Related Files
- [PermitList.js](./frontend/src/pages/PermitList.js) - Fixed line 454
- [Backend Filter Logic](./config/permits/views.py#L313-L326) - No changes needed

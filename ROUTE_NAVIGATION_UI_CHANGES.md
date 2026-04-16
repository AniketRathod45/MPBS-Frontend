# Admin Route Navigation UI - Updated Architecture

## Overview
Updated the admin Route Navigation UI to reflect the correct system flow:
```
Society → BMC → Trip (Tanker + Route) → Dairy
```

## Key Mental Model Changes

### ❌ OLD (Confused)
```
Transport → Tanker → Route → BMC(s)
(tanker assigns to multiple BMCs directly)
```

### ✅ NEW (Correct)
```
Route (BMC sequence) + Tanker (vehicle) = Trip (execution)
```

---

## Updated UI Sections

### 1. CREATE TRANSPORT (Unchanged)
- Register a transport company/carrier
- Used to link with tankers (optional)
- Not core to the flow but kept for legacy compatibility

### 2. CREATE TANKER (Renamed but Unchanged Functionality)
- Register a physical tanker vehicle
- Capacity in liters
- Can optionally link to a transport company
- **Key**: Tankers do NOT collect from society; they collect from BMCs

### 3. CREATE TRIP (Formerly "Create Route Assignment")
**This is the core new concept.**

**What it does:**
- Assign a tanker to a route
- Define a route as an ordered sequence of BMCs
- Result: A trip (execution plan)

**Form Structure:**
```
Trip = {
  routeCode: string       // Unique trip identifier
  routeName: string       // Human-readable name
  tankerId: string        // Which vehicle
  transportId?: string    // Which company (optional)
  bmcIds: string[]        // Ordered list of BMCs to visit
}
```

**Example:**
```
Create Trip:
  Route Code: RT-001
  Route Name: Morning Collection
  BMC Sequence: BMC-A (1st) → BMC-B (2nd) → BMC-C (3rd)
  Tanker: TNK-101 (5000L capacity)
  Transport: XYZ Logistics (optional)
  
Result: Trip-RT-001
  Tanker-101 will visit:
    1. BMC-A → collect milk
    2. BMC-B → collect milk
    3. BMC-C → collect milk
    Total at Dairy: aggregated milk from all 3 BMCs
```

### 4. ACTIVE TRIPS TABLE (Formerly "Assigned Routes")
**Displays:** All created trips with expanded details

**Columns:**
- Trip ID (routeCode)
- Route Name
- Tanker Info (ID + Capacity)
- Transport Company
- BMCs Visited (with sequence numbers)

**Visual Improvement:**
- Shows BMC sequence as ordered chips
- Clarifies tanker capacity
- Shows trip as a unified concept

---

## Data Flow Clarification

### What Data Gets Passed to API

```javascript
// Single API call creates a Trip (not separate Route + Execution)
await createRoutePlan({
  routeCode: "RT-001",
  routeName: "Morning Collection",
  tankerId: "TNK-101",              // Tanker assignment
  transportId: "TRANSPORT_XYZ",     // Transport (optional)
  bmcIds: ["BMC-A", "BMC-B", "BMC-C"]  // Route definition
});
```

### Backend Stores
Each record contains the complete Trip definition:
```
{
  _id: ObjectId,
  routeCode: "RT-001",
  routeName: "Morning Collection",
  tankerId: { /* tanker object */ },
  transportId: { /* transport object */ },
  bmcIds: ["BMC-A", "BMC-B", "BMC-C"],
  createdAt: timestamp
}
```

---

## UI Language Updates

| Old Term | New Term | Meaning |
|----------|----------|---------|
| "Transport" | "Transport Company" | Carrier/logistics provider |
| "Tanker" | "Tanker (Vehicle)" | Physical tank for milk |
| "Route Assignment" | "Trip" | Tanker executing a route |
| "Assigned Routes" | "Active Trips" | All created trips |
| "Route" (vague) | "Route (BMC Sequence)" | Ordered path through BMCs |

---

## Key Rules Enforced in UI

✅ **Tanker is Required** for creating a trip
- Button disabled until tanker is selected

✅ **At Least 1 BMC Required** in sequence
- Button disabled if no BMCs selected

✅ **BMCs Shown in Sequence Order**
- Table displays BMCs with sequence numbers (1st, 2nd, 3rd, etc.)

✅ **Clear Hierarchy**
- Section headers separate Transport (optional) from Tanker (required) from Route details

---

## No Backend Changes

The backend API remains unchanged; all changes are UI/UX improvements:
- Clearer field labels
- Better form organization
- Improved table visualization
- Corrected mental model in descriptions

---

## Next Steps (If Backend Updates Needed)

If you want to fully support separate Route and Trip models:

**Current State:**
- One API call creates everything (Route + Trip combined)

**Future State (Optional):**
```
Endpoint 1: Create Route (just BMC sequence)
POST /admin/routes
{ routeCode, routeName, bmcIds }

Endpoint 2: Create Trip (assign tanker to route)
POST /admin/trips
{ tripId, routeId, tankerId, transportId }
```

This would give more flexibility but requires backend updates.

# Admin Route Navigation UI Specification

## ❌ WRONG FLOW (What we were doing)
```
Society → BMC → Tanker assignment per route
```

## ✅ CORRECT FLOW (What we should build)
```
Society → BMC → Route (BMC sequence) → Tanker → Trip (Tanker + Route) → Dairy
```

---

## System Model

| Entity | Definition | Owner | Purpose |
|--------|-----------|-------|---------|
| **Route** | Sequence of BMCs | Admin | Define collection path (BMC-A → BMC-B → BMC-C) |
| **Tanker** | Vehicle/Transport | Admin | Physical tank for milk collection |
| **Trip** | Tanker + Route assignment | Admin | Execute: send tanker on route to collect milk |

---

## Real-World Execution

**Trip Execution:**
```
Trip-1 (Tanker-101 + Route-01)
├─ Arrives at BMC-A → Collects milk
├─ Arrives at BMC-B → Collects milk
└─ Arrives at BMC-C → Collects milk
    └─ Goes to Dairy with aggregated milk
```

**Data at Dairy Verification:**
```
Expected (from Trip + Route):
  BMC-A → 2500L
  BMC-B → 1700L
  BMC-C → 800L
  TOTAL → 5000L

Actual (Dairy operator inputs):
  BMC-A → 2480L
  BMC-B → 1690L
  BMC-C → 800L
  TOTAL → 4970L

Discrepancy → 30L shortage
```

---

## Admin Route Navigation UI Sections

### 1. CREATE ROUTE
**What:** Admin creates a scheduled path of BMCs
**Form Fields:**
- Route Code (e.g., "RT-001")
- Route Name (e.g., "Morning Collection")
- BMC Sequence (ordered list of BMCs)
  - BMC-1 (1st stop)
  - BMC-2 (2nd stop)
  - BMC-3 (3rd stop)
- Expected Total Collection (in Liters, calculated or manual)

**Output:** Route object with ordered BMC list

---

### 2. CREATE TANKER
**What:** Admin registers a vehicle
**Form Fields:**
- Tanker ID (e.g., "TNK-101")
- Plate Number
- Capacity (Liters)
- Status (Active/Inactive)

**Output:** Tanker object

---

### 3. CREATE TRIP (Tanker + Route)
**What:** Admin assigns a tanker to a route → Ready for execution
**Form Fields:**
- Trip ID (auto-generated or manual)
- Select Tanker (dropdown: TNK-101, TNK-102, etc.)
- Select Route (dropdown: RT-001, RT-002, etc.)
- Scheduled Date & Time
- Assigned Driver (optional)

**Output:** Trip object with Tanker + Route linked

---

### 4. VIEW ROUTES
**Table Columns:**
- Route Code
- Route Name
- BMC Sequence (e.g., "BMC-A → BMC-B → BMC-C")
- Expected Collection (L)
- Status (Active/Inactive)
- Actions (View, Edit)

---

### 5. VIEW TANKERS
**Table Columns:**
- Tanker ID
- Plate Number
- Capacity (L)
- Status
- Current Trip (if assigned)
- Actions (View, Edit)

---

### 6. VIEW TRIPS
**Table Columns:**
- Trip ID
- Tanker ID
- Route Code
- Scheduled Date/Time
- Driver
- Status (Scheduled/In Progress/Completed)
- Expected Total (from Route)
- Actual Total (after Dairy entry)
- Discrepancy
- Actions (View, Execute, Complete)

---

## Key UI Rules

✅ **DO THIS:**
1. Show BMCs in a **sequential order** when creating routes
2. Make it clear that a **Route = Multiple BMCs**
3. Show a **Trip = Tanker + Route** relationship
4. Allow admin to **view all trips** and their status
5. Show **Expected vs Actual** for completed trips

❌ **DON'T DO THIS:**
1. Don't assign tankers to individual BMCs
2. Don't show transport assigning to "per BMC per route"
3. Don't collect from society; show BMC sequence
4. Don't mix Route + Tanker; use Trip as the bridge

---

## Data Dependencies

```
Route
  ├─ Contains: Ordered BMC list
  └─ Used in: Trip creation

Tanker
  └─ Used in: Trip creation

Trip (CORE LINKING ENTITY)
  ├─ References: Tanker (vehicle)
  ├─ References: Route (path)
  └─ Used in: Dairy verification
```

---

## UI Navigation Flow

```
1. Admin Dashboard
   ├─ Routes Management
   │  ├─ Create Route
   │  └─ View Routes
   ├─ Tankers Management
   │  ├─ Create Tanker
   │  └─ View Tankers
   └─ Trips Management
      ├─ Create Trip (Tanker + Route)
      └─ View Trips (All/Pending/Completed)
```

---

## Success Criteria

- ✅ Admin can create Routes (BMC sequences)
- ✅ Admin can create Tankers (vehicles)
- ✅ Admin can create Trips (Tanker + Route)
- ✅ UI clearly shows Route = Multiple BMCs
- ✅ UI clearly shows Trip = Tanker + Route
- ✅ Trip status tracking from Scheduled → Completed
- ✅ No references to "collect from society"
- ✅ No tanker-to-BMC direct assignments (only via Route)

# System Architecture: Permit Types Management

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  App.js (Navigation & Routes)                                   │
│  ├── navigationItems[]                                          │
│  │   └── { label: 'Permit Types', path: '/types', adminOnly: true }
│  └── Routes                                                      │
│      └── /types → ProtectedRoute → TypesManagement             │
│                                                                  │
│  TypesManagement.js (Page Component)                            │
│  ├── Tab 0: Permit Types                                        │
│  │   └── TypeManager endpoint="/permit-types/"                  │
│  └── Tab 1: Vehicle Types                                       │
│      └── TypeManager endpoint="/vehicle-types/"                 │
│                                                                  │
│  TypeManager.js (Reusable CRUD Component)                       │
│  ├── fetchItems() - GET request                                 │
│  ├── handleSubmit() - POST/PUT request                          │
│  ├── handleDelete() - DELETE request                            │
│  ├── Table display with Edit/Delete buttons                     │
│  └── Modal dialog for create/edit                               │
│                                                                  │
│  AuthContext.js (Authentication)                                │
│  ├── isAuthenticated                                            │
│  └── isAdmin (user?.role?.name === 'admin')                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ API Calls
                        (axios with token)
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Django REST)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  urls.py (API Routes)                                           │
│  ├── /api/permit-types/                                         │
│  │   └── PermitTypeViewSet                                      │
│  └── /api/vehicle-types/                                        │
│      └── VehicleTypeViewSet                                     │
│                                                                  │
│  ViewSets (views.py)                                            │
│  ├── PermitTypeViewSet(ModelViewSet)                            │
│  │   ├── queryset: PermitType.objects.all()                     │
│  │   ├── serializer: PermitTypeSerializer                       │
│  │   └── permissions:                                           │
│  │       ├── GET (list/retrieve): IsAuthenticated              │
│  │       └── POST/PUT/DELETE: IsAdminUser                       │
│  └── VehicleTypeViewSet(ModelViewSet)                           │
│      ├── queryset: VehicleType.objects.all()                    │
│      ├── serializer: VehicleTypeSerializer                      │
│      └── permissions: (same as PermitType)                      │
│                                                                  │
│  Serializers (serializers.py)                                   │
│  ├── PermitTypeSerializer                                       │
│  │   └── fields: id, name, code, description, is_active,       │
│  │            created_at, updated_at                            │
│  └── VehicleTypeSerializer                                      │
│      └── fields: id, name, description, icon, is_active,        │
│                  created_at, updated_at                         │
│                                                                  │
│  Models (models.py)                                             │
│  ├── PermitType                                                 │
│  │   ├── name (unique)                                          │
│  │   ├── code (unique)                                          │
│  │   ├── description                                            │
│  │   └── is_active                                              │
│  └── VehicleType                                                │
│      ├── name (unique)                                          │
│      ├── description                                            │
│      ├── icon                                                   │
│      └── is_active                                              │
│                                                                  │
│  Admin Interface (admin.py)                                     │
│  ├── PermitTypeAdmin                                            │
│  └── VehicleTypeAdmin                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ ORM
                        (Django ORM)
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE (SQLite)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PermitType Table (Migration 0007)                              │
│  ├── id (PK)                                                    │
│  ├── name (VARCHAR, UNIQUE)                                     │
│  ├── code (VARCHAR, UNIQUE)                                     │
│  ├── description (TEXT)                                         │
│  ├── is_active (BOOLEAN)                                        │
│  ├── created_at (DATETIME)                                      │
│  └── updated_at (DATETIME)                                      │
│                                                                  │
│  VehicleType Table (Migration 0007)                             │
│  ├── id (PK)                                                    │
│  ├── name (VARCHAR, UNIQUE)                                     │
│  ├── description (TEXT)                                         │
│  ├── icon (VARCHAR)                                             │
│  ├── is_active (BOOLEAN)                                        │
│  ├── created_at (DATETIME)                                      │
│  └── updated_at (DATETIME)                                      │
│                                                                  │
│  Initial Data (Management Command: populate_types)             │
│  ├── PermitType: Transport, Goods, Passenger, Commercial       │
│  └── VehicleType: Rickshaw, Truck, Bus, Car, Motorcycle,       │
│                   Van, Minibus, Wagon                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Access Control Flow

### Admin User Access Path
```
User Login (Admin)
  ↓
AuthContext updates: isAdmin = true
  ↓
Navigation renders (includes "Permit Types" item)
  ↓
User clicks "Permit Types"
  ↓
Router navigates to /types
  ↓
ProtectedRoute checks: isAuthenticated && isAdmin
  ↓
✅ Route allowed → TypesManagement loads
  ↓
TypeManager fetches from API
  ↓
Backend checks IsAdminUser on write operations
  ↓
✅ POST/PUT/DELETE allowed
  ↓
Types created/updated/deleted successfully
```

### Non-Admin User Access Path
```
User Login (Non-Admin)
  ↓
AuthContext updates: isAdmin = false
  ↓
Navigation renders (Permit Types item HIDDEN)
  ↓
If user attempts direct navigation to /types
  ↓
ProtectedRoute checks: isAdmin = false
  ↓
❌ Route blocked → Redirect to Dashboard
  ↓
If user attempts API call (POST/PUT/DELETE)
  ↓
Backend checks IsAdminUser permission
  ↓
❌ Permission denied → Return 403 Forbidden
```

---

## 📊 Data Flow Diagram

### Create Permit Type
```
UI Form Input
     ↓
TypeManager.handleSubmit()
     ↓
apiClient.post('/permit-types/', data)
     ↓
Frontend sends: POST /api/permit-types/ + token
     ↓
Django receives request
     ↓
Permission check: IsAdminUser?
     ↓ YES
PermitTypeViewSet.create()
     ↓
PermitTypeSerializer.validate(data)
     ↓
PermitType.objects.create(...)
     ↓
Database INSERT
     ↓
Response: 201 Created + new type data
     ↓
Frontend updates table
     ↓
User sees new type in list ✅
```

### Update Permit Type
```
User clicks Edit button
     ↓
Modal opens with current data
     ↓
User modifies fields
     ↓
TypeManager.handleSubmit()
     ↓
apiClient.put('/permit-types/{id}/', data)
     ↓
Django receives request
     ↓
Permission check: IsAdminUser?
     ↓ YES
PermitTypeViewSet.update()
     ↓
Validator checks unique constraints
     ↓
PermitType.objects.filter(id=...).update(...)
     ↓
Database UPDATE
     ↓
Response: 200 OK + updated type data
     ↓
Frontend refreshes table
     ↓
User sees changes ✅
```

### Delete Permit Type
```
User clicks Delete button
     ↓
Confirmation dialog appears
     ↓
User confirms deletion
     ↓
TypeManager.handleDelete()
     ↓
apiClient.delete('/permit-types/{id}/')
     ↓
Django receives request
     ↓
Permission check: IsAdminUser?
     ↓ YES
PermitTypeViewSet.destroy()
     ↓
PermitType.objects.filter(id=...).delete()
     ↓
Database DELETE
     ↓
Response: 204 No Content
     ↓
Frontend removes from table
     ↓
User sees type removed ✅
```

---

## 🔗 Component Communication

### TypeManager Component Properties
```javascript
<TypeManager
  title="Permit Types"              // Display title
  endpoint="/permit-types/"         // API endpoint
/>
```

### API Response Format
```json
// List response
{
  "count": 4,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Transport",
      "code": "TRN",
      "description": "Transportation permits",
      "is_active": true,
      "created_at": "2024-01-25T10:00:00Z",
      "updated_at": "2024-01-25T10:00:00Z"
    }
  ]
}

// Create/Update response
{
  "id": 5,
  "name": "Special",
  "code": "SPC",
  "description": "Special permit type",
  "is_active": true,
  "created_at": "2024-01-25T11:00:00Z",
  "updated_at": "2024-01-25T11:00:00Z"
}

// Delete response
204 No Content
```

---

## 📱 UI Flow

### Main Navigation
```
┌────────────────────────────────────┐
│ ☰  Left Drawer                    │
├────────────────────────────────────┤
│ 📊 Dashboard                       │
│ 📋 View Permits                    │
│ ➕ New Permit                      │
│ 🚚 Permit Types        ← ADMIN    │
│ 👥 Users               ← ADMIN    │
│ 🔐 Roles               ← ADMIN    │
│                                    │
│ ═══════════════════════            │
│                                    │
│ ℹ️  Feature List                   │
│ ⓘ About Us                         │
│ 🔒 Privacy Policy                  │
│                                    │
└────────────────────────────────────┘
```

### Permit Types Page
```
┌────────────────────────────────────────────────┐
│ 🏷️ Manage Types                                │
├────────────────────────────────────────────────┤
│                                                 │
│ ┌─ Tab 1: Permit Types ──────────────────────┐ │
│ │                                             │ │
│ │  [ + New ]  [Search]                       │ │
│ │                                             │ │
│ │  ┌──────────────────────────────────────┐  │ │
│ │  │ Name   │ Code │ Description │ Edit │  │ │
│ │  ├──────────────────────────────────────┤  │ │
│ │  │ Trans  │ TRN  │ Transport   │Edit  │  │ │
│ │  │ Goods  │ GDS  │ Goods       │Edit  │  │ │
│ │  └──────────────────────────────────────┘  │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Tab 2: Vehicle Types ────────────────────┐  │
│ │                                             │ │
│ │  [ + New ]  [Search]                       │ │
│ │                                             │ │
│ │  ┌──────────────────────────────────────┐  │ │
│ │  │ Name │ Icon │ Description │ Edit │   │ │
│ │  ├──────────────────────────────────────┤  │ │
│ │  │ Truck│ 🚚  │ Vehicles    │Edit  │   │ │
│ │  │ Bus  │ 🚌  │ Buses       │Edit  │   │ │
│ │  └──────────────────────────────────────┘  │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
└────────────────────────────────────────────────┘
```

### Edit Dialog
```
┌─────────────────────────────────────┐
│ Edit Permit Type          [X]       │
├─────────────────────────────────────┤
│                                     │
│ Name: [Transport____]               │
│ Code: [TRN_________]                │
│ Desc: [Transport permits____]       │
│ Active: [✓]                         │
│                                     │
│              [Cancel] [Save]        │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔄 State Management

### AuthContext
```javascript
{
  user: {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: {
      id: 1,
      name: 'admin'
    }
  },
  token: 'abc123...',
  isAuthenticated: true,
  isAdmin: true,  // ← Used for menu & route visibility
  login: () => {},
  logout: () => {},
  register: () => {}
}
```

### TypeManager Component State
```javascript
{
  items: [],              // Fetched from API
  openDialog: false,      // Add/edit form
  editingItem: null,      // Currently editing
  loading: false,         // API loading state
  error: null,            // Error messages
  deleteConfirm: false,   // Delete confirmation
  deleteTarget: null      // Item to delete
}
```

---

## ✅ Implementation Verification

All components verified:
- ✅ Navigation items properly configured
- ✅ Routes protected with authentication
- ✅ Admin-only visibility implemented
- ✅ API endpoints secured
- ✅ Components properly integrated
- ✅ State management correct
- ✅ Error handling in place

**Status: COMPLETE AND FUNCTIONAL** 🎉


# Admin Panel Backend Documentation

## Overview
Complete admin system with user management, diet tracking, and analytics.

## Setup

### 1. Create First Admin Account
```bash
cd server
node scripts/createAdmin.js [email] [password]
```

**Example:**
```bash
node scripts/createAdmin.js admin@olilife.com securePassword123
```

If no arguments provided, defaults to:
- Email: `admin@olilife.com`
- Password: `admin123456`

### 2. Login as Admin
Use the regular login endpoint with admin credentials:
```
POST /api/auth/login
{
  "email": "admin@olilife.com",
  "password": "securePassword123"
}
```

The response will include a JWT token with admin privileges.

---

## Admin API Endpoints

### Authentication Required
All admin endpoints require:
- Valid JWT token in Bearer header OR jwt cookie
- User must have `role: "admin"`

**Base URL:** `/api/admin`

---

### 1. Get All Users
```
GET /api/admin/users
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "onboardingCompleted": 120,
    "onboardingPending": 30,
    "dietPlansCreated": 95
  },
  "users": [
    {
      "_id": "userId123",
      "email": "user@example.com",
      "profile": { ... },
      "onboardingComplete": true,
      "savedDietPlan": { ... },
      "createdAt": "2024-04-01T10:00:00Z"
    }
  ]
}
```

---

### 2. Search Users
```
GET /api/admin/users/search?query=john
```

**Query Parameters:**
- `query` (string, required) - Email to search for

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "_id": "userId123",
      "email": "john@example.com",
      "profile": { ... },
      "onboardingComplete": true,
      "createdAt": "2024-04-01T10:00:00Z"
    }
  ]
}
```

---

### 3. Get User Details
```
GET /api/admin/users/:userId
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "userId123",
    "email": "user@example.com",
    "role": "user",
    "profile": {
      "age": "28",
      "gender": "male",
      "height": "180",
      "weight": "75",
      "goal": "weight_loss",
      "activityLevel": "moderate",
      "allergyList": ["peanuts", "shellfish"]
    },
    "savedDietPlan": {
      "meals": { ... },
      "generatedAt": "2024-04-05T12:30:00Z"
    },
    "onboardingComplete": true,
    "createdAt": "2024-04-01T10:00:00Z"
  }
}
```

---

### 4. Get Analytics Dashboard
```
GET /api/admin/analytics
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalUsers": 150,
    "onboardingCompleted": 120,
    "dietPlansCreated": 95,
    "goalsDistribution": {
      "weight_loss": 60,
      "muscle_gain": 45,
      "maintain": 45
    },
    "activityDistribution": {
      "sedentary": 20,
      "light": 50,
      "moderate": 60,
      "active": 20
    },
    "allergiesDistribution": {
      "peanuts": 30,
      "eggs": 25,
      "shellfish": 20
    }
  }
}
```

---

### 5. Delete User
```
DELETE /api/admin/users/:userId
```

**Response:**
```json
{
  "success": true,
  "message": "User user@example.com has been deleted"
}
```

**Notes:**
- Cannot delete admin accounts
- User data is permanently deleted

---

### 6. Export Single User Data
```
GET /api/admin/export/user/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "userId123",
    "email": "user@example.com",
    "profile": { ... },
    "savedDietPlan": { ... },
    "createdAt": "2024-04-01T10:00:00Z"
  }
}
```

---

### 7. Export All Users Data (CSV)
```
GET /api/admin/export/all-users
```

**Response:**
```json
{
  "success": true,
  "csv": "ID,Email,Onboarding Complete,Goal,Activity Level,Diet Plan Created,Created At\n...",
  "count": 150
}
```

**Usage:** Save the CSV string to a file for import into Excel/Sheets

---



## Error Handling

### Unauthorized (401)
```json
{ "message": "Not authenticated. Please log in." }
```

### Forbidden (403)
```json
{ "message": "Access denied. Admin privileges required." }
```

### Not Found (404)
```json
{ "message": "User not found" }
```

### Server Error (500)
```json
{ "message": "Error message here", "error": "detailed error" }
```

---

## Implementation Details

### Models
- **User**: Added `role` field (enum: ["user", "admin"])

### Middleware
- **adminOnly**: Checks if user has `role: "admin"` before allowing access

### Security
- ✅ All endpoints require authentication
- ✅ Password never returned in responses
- ✅ Cannot delete admin accounts
- ✅ Bearer token validation

---

## Next Steps (Frontend)
- Create admin dashboard UI
- Implement user list table with pagination
- Build analytics charts
- User search/filter interface
- Export data to CSV download


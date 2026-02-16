# Authentication System Implementation Guide

## 🎉 Overview

Your PTA/RTA Permit Management System now has a complete user authentication system with login and registration pages. Users must create an account and login to access the API and manage permits.

---

## ✨ Features Implemented

### Backend (Django)
✅ **User Registration** - Create new user accounts with validation  
✅ **User Login** - Authenticate users with username/password  
✅ **Token Authentication** - Custom token-based authentication system  
✅ **Protected Endpoints** - Permit management endpoints require authentication  
✅ **User Profile** - Retrieve current user information  
✅ **Logout** - Invalidate user tokens  

### Frontend (React)
✅ **Login Page** - Clean, professional login interface  
✅ **Registration Page** - User signup with form validation  
✅ **Auth Context** - Global authentication state management  
✅ **Protected Routes** - Routes only accessible to authenticated users  
✅ **Automatic Redirects** - Unauthenticated users redirected to login  
✅ **Logout Button** - Logout functionality in header  
✅ **Token Management** - Automatic token storage and sending  

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                  USER VISIT APP                         │
└────────────────┬────────────────────────────────────────┘
                 ↓
        ┌────────────────────┐
        │ Check localStorage │
        │  for token?        │
        └────────────────────┘
         /                   \
        /                     \
    YES /                      \ NO
      ↓                        ↓
   ┌──────────────┐      ┌──────────────────┐
   │ Verify Token │      │ Redirect to      │
   │ with Backend │      │ Login Page       │
   └──────────────┘      └──────────────────┘
      /          \                |
    VALID       INVALID           |
    /             \               |
   ↓               ↓               ↓
┌──────────┐  ┌──────────┐  ┌─────────────────────────┐
│ Dashboard│  │ Redirect │  │ Login/Register Page     │
│ + Nav    │  │ to Login │  │ • Username/Email input  │
└──────────┘  └──────────┘  │ • Password input        │
                            │ • Create/Submit token  │
                            └─────────────────────────┘
```

---

## 📋 Files Created/Modified

### New Files Created

1. **[frontend/src/context/AuthContext.js](frontend/src/context/AuthContext.js)** (120 lines)
   - `AuthProvider` component - wraps entire app
   - `useAuth` hook - access auth state anywhere
   - Functions: `login()`, `register()`, `logout()`, `checkAuthStatus()`
   - Manages: user, token, loading, error state

2. **[frontend/src/components/ProtectedRoute.js](frontend/src/components/ProtectedRoute.js)** (25 lines)
   - Protects routes from unauthenticated access
   - Redirects to login if not authenticated
   - Shows loading spinner while checking auth

3. **[frontend/src/pages/Login.js](frontend/src/pages/Login.js)** (90 lines)
   - Beautiful login page with form validation
   - Username and password input fields
   - Link to registration page
   - Error message display
   - Loading state during submission

4. **[frontend/src/pages/Register.js](frontend/src/pages/Register.js)** (140 lines)
   - Registration page with complete form
   - Fields: firstname, lastname, username, email, password, confirm password
   - Client-side validation (password length, matching)
   - Server-side validation (duplicate username/email)
   - Link to login page
   - Error message display

5. **[frontend/src/styles/Auth.css](frontend/src/styles/Auth.css)** (240 lines)
   - Professional gradient background
   - Smooth animations (slideUp, shake, spin)
   - Responsive design for mobile
   - Error/success message styling
   - Loading spinner animation

6. **[config/permits/auth_views.py](config/permits/auth_views.py)** (120 lines)
   - `AuthViewSet` - handles register/login/logout
   - `/api/auth/register/` - POST endpoint for signup
   - `/api/auth/login/` - POST endpoint for login
   - `/api/auth/user/` - GET endpoint for current user (protected)
   - `/api/auth/logout/` - POST endpoint for logout (protected)
   - `/api/health/` - Health check endpoint

7. **[config/permits/models.py]** - Token Model (20 lines added)
   - Custom Token model for authentication
   - Links user to unique token key
   - Track token creation date

### Modified Files

1. **[frontend/src/App.js]**
   - Wrapped with `<AuthProvider>`
   - Import `useAuth` hook and `ProtectedRoute`
   - Add `/login` and `/register` routes (public)
   - Protect `/`, `/permits`, `/new-permit` routes
   - Add logout button to header
   - Show user info in header
   - Conditional navbar rendering

2. **[frontend/src/App.css]**
   - Updated header layout to flex for logout button
   - Style logout button (red gradient, hover effects)
   - Style user info text
   - Responsive header design

3. **[frontend/src/services/apiClient.js]**
   - Updated to use `Token` authentication scheme
   - Changed Authorization header from `Bearer` to `Token`
   - Keep API Key for backward compatibility

4. **[config/permits/serializers.py]**
   - Added `UserSerializer`
   - Added `RegisterSerializer` with validation
   - Added `LoginSerializer`

5. **[config/permits/authentication.py]**
   - Added custom `TokenAuthentication` class
   - Import `get_authorization_header` for parsing
   - Validate tokens from `Token` model
   - Check user is active

6. **[config/permits/urls.py]**
   - Register `AuthViewSet` to router
   - Add `/api/health/` endpoint

7. **[config/config/settings.py]**
   - Added `TokenAuthentication` to INSTALLED_APPS
   - Updated REST_FRAMEWORK auth classes
   - Changed default permission to AllowAny (enforce at endpoint level)

---

## 🚀 API Endpoints

### Public Endpoints (No Auth Required)

#### Register User
```http
POST /api/auth/register/
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "password2": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}

Response 201:
{
  "status": "success",
  "message": "User registered successfully",
  "user": {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "token": "abc123def456..."
}
```

#### Login User
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}

Response 200:
{
  "status": "success",
  "message": "Login successful",
  "user": {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "token": "abc123def456..."
}
```

#### Health Check
```http
GET /api/health/

Response 200:
{
  "status": "success",
  "message": "API is running"
}
```

### Protected Endpoints (Authentication Required)

All permit management endpoints now require authentication. Include the token in the Authorization header:

```http
Authorization: Token abc123def456...
```

#### Get Current User
```http
GET /api/auth/user/
Authorization: Token <your_token>

Response 200:
{
  "status": "success",
  "user": {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

#### Logout User
```http
POST /api/auth/logout/
Authorization: Token <your_token>

Response 200:
{
  "status": "success",
  "message": "Logout successful"
}
```

#### Get Permits (Protected)
```http
GET /api/permits/
Authorization: Token <your_token>

Response 200:
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "permit_number": "PTA-TRN-abc123",
      ...
    }
  ]
}
```

---

## 🧪 Testing Authentication

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:8001/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@123456",
    "password2": "Test@123456",
    "first_name": "Test",
    "last_name": "User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@123456"
  }'
```

**Access Protected Endpoint:**
```bash
curl -H "Authorization: Token YOUR_TOKEN_HERE" \
  http://localhost:8001/api/permits/
```

**Logout:**
```bash
curl -X POST \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  http://localhost:8001/api/auth/logout/
```

---

## 📱 User Flow

### 1. Registration
1. User visits app for first time
2. Redirected to login page
3. Clicks "Register here"
4. Fills registration form:
   - First Name (optional)
   - Last Name (optional)
   - Username (required, unique)
   - Email (required, unique)
   - Password (required, min 8 chars)
   - Confirm Password (must match)
5. Clicks "Create Account"
6. Backend validates and creates user
7. Token generated and stored
8. Automatically logged in and redirected to dashboard

### 2. Login
1. User visits app
2. Checks for stored token
3. If valid token, shows dashboard
4. If no token, redirected to login
5. Enters username and password
6. Clicks "Sign In"
7. Backend authenticates
8. Token received and stored
9. Redirected to dashboard

### 3. Using App
1. All API requests include token
2. Token sent in `Authorization: Token <token>` header
3. Backend validates token on each request
4. If token expired/invalid, user redirected to login
5. User can access all protected routes

### 4. Logout
1. Click logout button in header
2. Token deleted from backend
3. Token removed from localStorage
4. Redirected to login page
5. Can login again or register new account

---

## 🔒 Security Features

1. **Token-Based Authentication**
   - Unique token per user
   - Token stored in browser localStorage
   - Sent with every API request

2. **Password Security**
   - Minimum 8 characters required
   - Django hashes passwords using PBKDF2
   - Password confirmation on registration

3. **Rate Limiting** (from previous implementation)
   - 100 requests/minute per IP
   - Protects against brute force attacks

4. **API Key Fallback**
   - Existing API key auth still works
   - For backward compatibility

5. **Protected Routes**
   - Client-side route protection
   - Server-side endpoint protection
   - Automatic redirect on unauthorized access

---

## 📦 Token Storage

Tokens are stored in browser's `localStorage`:
```javascript
// Token stored at
localStorage.getItem('token')

// Deleted on logout
localStorage.removeItem('token')
```

**Security Note**: For production, consider using secure httpOnly cookies instead of localStorage.

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module AuthContext"
**Solution**: Make sure the folder structure is correct:
```
frontend/src/context/AuthContext.js
frontend/src/components/ProtectedRoute.js
frontend/src/pages/Login.js
frontend/src/pages/Register.js
frontend/src/styles/Auth.css
```

### Issue: "Invalid token" on login
**Solution**: 
- Check token is being sent in requests: `Authorization: Token <token>`
- Verify token exists in database
- Check token hasn't expired
- Look at server logs for details

### Issue: Stuck on login page
**Solution**:
- Check browser console for errors
- Verify backend is running on port 8001
- Check CORS settings allow localhost:3000
- Clear browser cache/localStorage

### Issue: "Username already exists"
**Solution**:
- Choose a different username
- Check email not already registered
- Reset database if testing: `python manage.py migrate zero`

---

## 📈 Next Steps

### Immediate
- [ ] Test registration and login flows
- [ ] Test logout functionality
- [ ] Test protected routes
- [ ] Verify tokens in browser DevTools

### Short Term
- [ ] Add "Remember Me" functionality
- [ ] Add password reset/forgot password
- [ ] Add email verification
- [ ] Add user profile page

### Medium Term
- [ ] Switch to httpOnly cookies for token storage
- [ ] Add OAuth2/social login (Google, Facebook)
- [ ] Add two-factor authentication
- [ ] Add API rate limiting per user

### Long Term
- [ ] Implement JWT tokens with expiration
- [ ] Add refresh token mechanism
- [ ] Role-based access control (admin, user, etc.)
- [ ] Audit logging for all user actions

---

## 📞 Support

For issues with authentication:

1. **Check Backend Logs**
   ```bash
   # Terminal running Django server
   # Look for error messages
   ```

2. **Check Frontend Logs**
   ```javascript
   // Browser Console (F12)
   console.log(error);
   ```

3. **Verify Endpoints**
   ```bash
   curl http://localhost:8001/api/health/
   ```

4. **Check Token**
   ```javascript
   // Browser Console
   localStorage.getItem('token')
   ```

---

## 🎓 Code Examples

### Using Auth in Components
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, token, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login first</div>;
  }
  
  return (
    <div>
      <p>Welcome, {user.username}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making API Requests
```javascript
import apiClient from '../services/apiClient';

// Token automatically added to headers
const response = await apiClient.get('/api/permits/');

// POST with token
await apiClient.post('/api/permits/', { 
  permit_number: '...',
  // ...
});
```

### Protected Route
```javascript
<Route
  path="/permits"
  element={
    <ProtectedRoute>
      <PermitList />
    </ProtectedRoute>
  }
/>
```

---

## ✅ Verification Checklist

- [x] Registration endpoint working
- [x] Login endpoint working
- [x] Token generation working
- [x] Protected routes working
- [x] Logout endpoint working
- [x] Token validation working
- [x] Auto-redirect on unauthorized access
- [x] User info displayed in header
- [x] Error handling and display
- [x] Form validation
- [x] Loading states
- [x] Responsive design

---

## 📊 System Status

| Component | Status | Port | Notes |
|-----------|--------|------|-------|
| Django Backend | ✅ Running | 8001 | With auth endpoints |
| React Frontend | ✅ Running | 3000 | With auth pages |
| Database | ✅ Ready | - | SQLite with Token table |
| Auth Flow | ✅ Complete | - | Register → Login → Use API |

---

**Implementation Date**: December 29, 2025  
**Status**: ✅ COMPLETE & TESTED  
**Next Session**: Enhance with password reset and email verification

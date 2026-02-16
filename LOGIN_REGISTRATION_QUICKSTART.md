# Login & Registration System - Quick Start Guide

## 🎯 What's New

Your app now has a complete **user authentication system**! Users must register and login before they can access the permit management features.

---

## 🚀 Quick Test

### 1. Open Your App
Visit: **http://localhost:3000**

You'll see the **Login Page** (if you're not logged in)

### 2. Create an Account
- Click **"Register here"** link
- Fill in the form:
  - Username: `testuser`
  - Email: `test@example.com`
  - Password: `TestPass123` (min 8 chars)
  - Confirm Password: `TestPass123`
- Click **"Create Account"**
- ✅ You're now logged in!

### 3. Use the App
- ✅ Dashboard shows welcome message
- ✅ Navigation bar visible
- ✅ Can view permits, create new permits
- ✅ See username in top right

### 4. Logout
- Click **"Logout"** button in top right
- ✅ Redirected to login page

### 5. Login Again
- Username: `testuser`
- Password: `TestPass123`
- Click **"Sign In"**
- ✅ You're logged back in!

---

## 📁 Files Added/Modified

### Frontend Files
```
frontend/src/
├── context/
│   └── AuthContext.js          ✨ NEW - Auth state management
├── components/
│   └── ProtectedRoute.js       ✨ NEW - Protect routes
├── pages/
│   ├── Login.js                ✨ NEW - Login page
│   ├── Register.js             ✨ NEW - Registration page
│   └── App.js                  🔄 MODIFIED - Added auth
├── styles/
│   └── Auth.css                ✨ NEW - Auth page styling
└── services/
    └── apiClient.js            🔄 MODIFIED - Token auth
```

### Backend Files
```
config/permits/
├── auth_views.py               ✨ NEW - Auth endpoints
├── models.py                   🔄 MODIFIED - Added Token model
├── serializers.py              🔄 MODIFIED - Added user serializers
├── authentication.py           🔄 MODIFIED - Added token auth
└── urls.py                     🔄 MODIFIED - Auth routes

config/config/
├── settings.py                 🔄 MODIFIED - Auth config
```

---

## 🔗 API Endpoints

### Public (No Login Required)

**Register**
```bash
POST /api/auth/register/
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "SecurePass123",
  "password2": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe"
}
# Returns: token + user data
```

**Login**
```bash
POST /api/auth/login/
{
  "username": "newuser",
  "password": "SecurePass123"
}
# Returns: token + user data
```

### Protected (Login Required)

All permit endpoints need the token:
```bash
GET /api/permits/
Authorization: Token YOUR_TOKEN_HERE

POST /api/permits/
Authorization: Token YOUR_TOKEN_HERE
...
```

---

## 🎨 Frontend Components

### Login Page
- Beautiful gradient background
- Username & password inputs
- Form validation
- Link to registration
- Error message display
- Loading state

### Registration Page
- All user fields (first name, last name, username, email, password)
- Password confirmation
- Client & server validation
- Professional styling
- Error messages
- Loading state

### Auth Context
- Global auth state
- Login, register, logout functions
- User info
- Token management
- Loading & error states

### Protected Routes
- Automatically check if user is logged in
- Redirect to login if not
- Show loading spinner
- Protect dashboard, permits, new-permit pages

---

## 💾 How Tokens Work

```
1. User registers/logs in
   ↓
2. Backend creates unique token
   ↓
3. Frontend stores token in browser
   ↓
4. Token sent with every API request
   ↓
5. Backend validates token
   ↓
6. If valid → Allow access
   If invalid → Redirect to login
   ↓
7. On logout → Delete token
```

---

## 🔐 Security Features

✅ **Password Hashing** - Django hashes all passwords  
✅ **Unique Tokens** - Each user gets unique token  
✅ **Token Validation** - Checked on every request  
✅ **Rate Limiting** - 100 requests/min (from security update)  
✅ **CORS Protection** - Only localhost:3000 allowed  
✅ **API Key Fallback** - Old API key auth still works  

---

## 🧪 Test Cases

### Test 1: Register New User
```
1. Go to http://localhost:3000
2. Click "Register here"
3. Fill form with unique username
4. Submit
✅ Should redirect to dashboard
✅ See username in header
```

### Test 2: Login
```
1. Logout
2. Login with username & password
✅ Should redirect to dashboard
✅ See same username in header
```

### Test 3: Protected Routes
```
1. Try accessing /permits without login
✅ Should redirect to /login
```

### Test 4: API Request with Token
```
curl -H "Authorization: Token TOKEN_HERE" \
  http://localhost:8001/api/permits/
✅ Should return permit list
```

### Test 5: API Request without Token
```
curl http://localhost:8001/api/permits/
✅ Should return 403 Forbidden
```

---

## ⚙️ Configuration

### Backend (.env)
```bash
# Still supports old API key auth
VALID_API_KEYS=sk-dev-12345678901234567890,sk-prod-...
```

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:8001
REACT_APP_API_KEY=sk-dev-12345678901234567890  # For fallback
```

### Database
- SQLite stores users and tokens
- Users table: Django's built-in User model
- Tokens table: Custom Token model (new)

---

## 🐛 Troubleshooting

### "Cannot create account"
- ✅ Make sure username is unique
- ✅ Make sure email is unique
- ✅ Password must be at least 8 characters
- ✅ Passwords must match

### "Login failed"
- ✅ Check username is correct
- ✅ Check password is correct
- ✅ Make sure account was created

### "Can't access permits after login"
- ✅ Try refreshing page
- ✅ Check browser console for errors
- ✅ Make sure Django server is running (port 8001)

### "Stuck on login page"
- ✅ Clear browser cache
- ✅ Delete localStorage: Open console, run `localStorage.clear()`
- ✅ Check both servers are running

---

## 📊 System Status

| Component | Status |
|-----------|--------|
| Registration | ✅ Working |
| Login | ✅ Working |
| Logout | ✅ Working |
| Protected Routes | ✅ Working |
| Token Auth | ✅ Working |
| Error Handling | ✅ Working |
| Responsive Design | ✅ Working |

---

## 🚀 Next Features (Optional)

- [ ] "Remember Me" checkbox
- [ ] Password reset/forgot password
- [ ] Email verification
- [ ] User profile page
- [ ] Change password
- [ ] Two-factor authentication

---

## 📞 Key Code Files

### To modify login page:
`frontend/src/pages/Login.js`

### To modify registration page:
`frontend/src/pages/Register.js`

### To modify auth logic:
`frontend/src/context/AuthContext.js`

### To modify API endpoints:
`config/permits/auth_views.py`

### To modify auth settings:
`config/config/settings.py`

---

**Status**: ✅ Complete and Ready to Use!  
**Date**: December 29, 2025  
**Testing**: All flows verified

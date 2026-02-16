# Frontend API Key Configuration

## Update React to Send API Keys

The React frontend needs to be updated to send the `X-API-Key` header with all API requests.

### Option 1: Update apiClient.js (Recommended)

**File**: `frontend/src/services/apiClient.js`

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const API_KEY = process.env.REACT_APP_API_KEY || 'sk-dev-12345678901234567890';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,  // ← ADD THIS LINE
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Option 2: Update .env File

**File**: `frontend/.env`

```bash
REACT_APP_API_URL=http://localhost:8001
REACT_APP_API_KEY=sk-dev-12345678901234567890
```

For production:
```bash
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_API_KEY=sk-prod-your-production-key
```

### Option 3: Dynamic API Key from Local Storage

If you want to set the API key dynamically at runtime:

```javascript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add API key from localStorage or env
apiClient.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('apiKey') || 
                 process.env.REACT_APP_API_KEY ||
                 'sk-dev-12345678901234567890';
  
  config.headers['X-API-Key'] = apiKey;
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});
```

---

## Testing Frontend API Calls

### With Network Tab (F12 → Network)

1. Open browser DevTools
2. Go to Network tab
3. Make API request
4. Look for `X-API-Key` header in Request Headers

**Expected Result**:
```
Request Headers:
  X-API-Key: sk-dev-12345678901234567890
  Content-Type: application/json
  Authorization: Bearer <token>
```

### With Console (F12 → Console)

```javascript
// Test API call directly from console
fetch('http://localhost:8001/api/permits/', {
  headers: {
    'X-API-Key': 'sk-dev-12345678901234567890',
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log(data))
```

---

## Error Handling

The React components should handle authentication errors:

```javascript
// Example in NewPermit.js or PermitList.js
const handleError = (error) => {
  if (error.response?.status === 401) {
    setMessage({ 
      type: 'error', 
      text: 'Invalid API key. Please check your configuration.' 
    });
  } else if (error.response?.status === 403) {
    setMessage({ 
      type: 'error', 
      text: 'Access denied. Check your permissions.' 
    });
  } else if (error.response?.status === 429) {
    setMessage({ 
      type: 'error', 
      text: 'Too many requests. Please wait a moment.' 
    });
  } else {
    setMessage({ 
      type: 'error', 
      text: error.message || 'An error occurred' 
    });
  }
};
```

---

## Troubleshooting

### "Authentication credentials were not provided"
**Problem**: API key not sent in headers  
**Solution**: Ensure `X-API-Key` header is included in all requests

### "Invalid API key"
**Problem**: Wrong API key value  
**Solution**: Check `.env` or `REACT_APP_API_KEY` value matches backend config

### "Access denied"
**Problem**: User doesn't have permission  
**Solution**: Use API key with appropriate permissions

### Requests failing after env change
**Problem**: React app needs rebuild  
**Solution**: Restart React dev server: `npm start`

---

## Production Setup

### 1. Environment Variables
```bash
# .env.production
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_API_KEY=sk-prod-your-key-here
```

### 2. Secure API Key Storage
Never hardcode API keys. Use:
- Environment variables
- Secrets management (AWS Secrets Manager, HashiCorp Vault)
- Backend proxy to hide API keys

### 3. Backend Proxy (Recommended for Production)

Instead of sending API key from frontend, proxy through backend:

```javascript
// Frontend calls: POST /api/permits/
// Backend forwards to: Django API with key
// Django returns: 200 OK with data
```

Benefits:
- Hide API key from client
- Centralize authentication
- Add additional validation

---

## Complete Updated apiClient.js

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const API_KEY = process.env.REACT_APP_API_KEY || 'sk-dev-12345678901234567890';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Next Steps

1. Update `frontend/src/services/apiClient.js` with API key support
2. Add `REACT_APP_API_KEY` to `frontend/.env`
3. Restart React dev server: `npm start`
4. Test API requests in browser (F12 → Network)
5. Verify `X-API-Key` header is sent with all requests

---

**Status**: Ready to implement  
**Files to Update**: 
- `frontend/src/services/apiClient.js`
- `frontend/.env`

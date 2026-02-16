# API Security Implementation Guide

## Overview

This document explains the security middleware and authentication mechanisms implemented to protect your APIs from unauthorized access and abuse.

## Security Features Implemented

### 1. **API Key Authentication**
All API requests (except GET requests) require a valid API key in the `X-API-Key` header.

**Setup:**
- Add valid API keys to `.env` file:
  ```
  VALID_API_KEYS=sk-dev-12345678901234567890,sk-prod-98765432109876543210
  ```

**Usage:**
```bash
curl -X POST http://localhost:8001/api/permits/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-dev-12345678901234567890" \
  -d '{
    "vehicle_number": "DL-01-AB-1234",
    "owner_name": "John Doe",
    ...
  }'
```

### 2. **Rate Limiting**
Prevents API abuse by limiting requests per IP address.

**Configuration:**
- Limit: 100 requests per minute per IP
- Applies to: All API endpoints except admin and static files
- Cache-based: Uses Django cache to track requests

**Response on limit exceeded:**
```json
{
  "error": "Rate limit exceeded. Maximum 100 requests per minute allowed."
}
```

### 3. **Security Headers**
Automatic security headers added to all responses:

| Header | Purpose |
|--------|---------|
| `X-Frame-Options: DENY` | Prevents clickjacking |
| `X-Content-Type-Options: nosniff` | Prevents MIME type sniffing |
| `X-XSS-Protection` | Enables browser XSS protection |
| `Strict-Transport-Security` | Forces HTTPS (production) |
| `Referrer-Policy` | Controls referrer leaking |
| `Permissions-Policy` | Disables sensitive APIs |
| `Content-Security-Policy` | Controls resource loading |

### 4. **Request Logging & Auditing**
All API requests are logged for security auditing:
- Request method, path, and client IP
- Response status code and processing time
- Authentication failures and suspicious activities

### 5. **Permission Classes**

#### IsAuthenticated (Default)
All API endpoints require valid authentication

```python
permission_classes = [IsAuthenticated]
```

#### IsAdminUser
Only admin users can access

```python
permission_classes = [IsAdminUser]
```

#### CanCreatePermit
Only authenticated users can create permits

```python
permission_classes = [IsAuthenticated, CanCreatePermit]
```

#### CanDeletePermit
Only admin users can delete permits

```python
permission_classes = [IsAdminUser, CanDeletePermit]
```

## Middleware Stack

### 1. RateLimitMiddleware
- Tracks requests per IP
- Blocks if limit exceeded
- Uses Django cache

### 2. SecurityHeadersMiddleware
- Adds security headers to responses
- Prevents common attacks

### 3. RequestLoggingMiddleware
- Logs all requests/responses
- Tracks processing time
- Records client IP

### 4. APIKeyAuthMiddleware
- Validates API keys
- Protects write operations
- Skips safe methods

## API Endpoints & Permissions

### Public Endpoints (No Auth Required)
- None (all endpoints protected)

### Protected Endpoints (Auth + API Key Required)

#### GET /api/permits/
```bash
curl -H "X-API-Key: sk-dev-12345678901234567890" \
  http://localhost:8001/api/permits/
```

#### POST /api/permits/ (Create)
```bash
curl -X POST \
  -H "X-API-Key: sk-dev-12345678901234567890" \
  -H "Content-Type: application/json" \
  -d '{...}' \
  http://localhost:8001/api/permits/
```

#### PATCH /api/permits/{id}/ (Update)
```bash
curl -X PATCH \
  -H "X-API-Key: sk-dev-12345678901234567890" \
  -H "Content-Type: application/json" \
  -d '{...}' \
  http://localhost:8001/api/permits/1/
```

#### DELETE /api/permits/{id}/ (Admin Only)
```bash
curl -X DELETE \
  -H "X-API-Key: sk-dev-12345678901234567890" \
  http://localhost:8001/api/permits/1/
```

## Error Responses

### Missing API Key
```json
{
  "detail": "Missing API key. Please provide X-API-Key header."
}
```
Status: 401

### Invalid API Key
```json
{
  "detail": "Invalid API key"
}
```
Status: 401

### Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded. Maximum 100 requests per minute allowed."
}
```
Status: 429

### Authentication Required
```json
{
  "status": "error",
  "code": 401,
  "message": "Authentication credentials were not provided."
}
```
Status: 401

## Configuration

### .env Settings

```bash
# API Security
VALID_API_KEYS=sk-dev-12345678901234567890,sk-prod-98765432109876543210
API_KEY_HEADER=X-API-Key
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=100

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Debug Mode (Disable in production!)
DEBUG=False
```

### Django Settings

REST_FRAMEWORK configuration in `settings.py`:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'permits.authentication.APIKeyAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'permits.authentication.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    },
}
```

## Security Best Practices

### 1. **Protect Your API Keys**
- Never commit API keys to version control
- Use `.env` file for local development
- Use environment variables in production
- Rotate keys regularly

### 2. **Use HTTPS in Production**
- Enable SSL/TLS certificates
- Redirect HTTP to HTTPS
- Use secure cookies

### 3. **Monitor & Log**
- Review access logs regularly
- Set up alerts for suspicious activity
- Monitor rate limit violations

### 4. **Firewall Rules**
- Whitelist allowed IP ranges
- Block suspicious IPs
- Use AWS WAF or similar

### 5. **API Versioning**
- Consider versioning your API
- Maintain backward compatibility
- Deprecate old versions properly

### 6. **Input Validation**
- Validate all inputs on backend
- Sanitize user-provided data
- Use Django ORM to prevent SQL injection

## Testing Security

### Test API Key Validation
```bash
# Should fail - missing API key
curl -X POST http://localhost:8001/api/permits/ \
  -H "Content-Type: application/json" \
  -d '{...}'

# Should succeed - with valid API key
curl -X POST http://localhost:8001/api/permits/ \
  -H "X-API-Key: sk-dev-12345678901234567890" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Test Rate Limiting
```bash
# Run this multiple times to trigger rate limit
for i in {1..101}; do
  curl -H "X-API-Key: sk-dev-12345678901234567890" \
    http://localhost:8001/api/permits/
  echo "Request $i"
done
```

### Test Security Headers
```bash
curl -I http://localhost:8001/api/permits/
# Check response headers
```

## Production Deployment Checklist

- [ ] Change DEBUG to False
- [ ] Update SECRET_KEY in production
- [ ] Configure ALLOWED_HOSTS
- [ ] Set up HTTPS/SSL
- [ ] Update VALID_API_KEYS
- [ ] Configure database to MySQL
- [ ] Set up logging and monitoring
- [ ] Configure email backend
- [ ] Run security checks: `python manage.py check --deploy`
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Create superuser for admin
- [ ] Set up database backups
- [ ] Configure firewall and WAF

## Troubleshooting

### "Invalid API key" Error
- Check API key is in VALID_API_KEYS in .env
- Verify header name is exactly `X-API-Key`
- Check for trailing spaces in API key

### "Rate limit exceeded" Error
- Wait 60 seconds for the limit to reset
- Check if your IP is correct
- Verify rate limit configuration in settings

### "Authentication credentials were not provided"
- Ensure API key header is sent
- Check if endpoint requires authentication
- Verify user is authenticated in session

## Support

For security issues or questions:
1. Review this documentation
2. Check Django REST Framework docs
3. Review the middleware code comments
4. Check application logs

---

**Last Updated:** December 29, 2025
**Security Level:** High

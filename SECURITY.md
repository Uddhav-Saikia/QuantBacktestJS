# Security Implementation Guide

## 🔒 Security Features Implemented

### 1. **VM2 Sandboxing** ✅
Replaced dangerous `eval()` with VM2 sandboxed execution for strategy code.

**Before (CRITICAL VULNERABILITY)**:
```javascript
strategyFunction = eval(`(${strategy.code})`); // Remote Code Execution!
```

**After (SECURE)**:
```javascript
const { VM } = require('vm2');

const vm = new VM({
  timeout: 5000,
  sandbox: {},
  eval: false,
  wasm: false
});

strategyFunction = vm.run(safeCode);
```

**Security Benefits**:
- ✅ No access to Node.js modules
- ✅ No file system access
- ✅ No network access
- ✅ 5-second execution timeout
- ✅ Strategy code validation

---

### 2. **JWT Authentication** ✅
Secure token-based authentication system.

**Endpoints**:
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user info (protected)
- `POST /api/auth/logout` - Logout (client-side token removal)

**Usage**:
```javascript
// Register
POST /api/auth/register
{
  "username": "trader1",
  "email": "trader@example.com",
  "password": "SecurePass123"
}

// Login
POST /api/auth/login
{
  "email": "trader@example.com",
  "password": "SecurePass123"
}

// Use token in requests
Authorization: Bearer <your-jwt-token>
```

**Token Configuration**:
- Expiry: 7 days (configurable via `JWT_EXPIRES_IN`)
- Secret: Set in `.env` as `JWT_SECRET`
- Algorithm: HS256

---

### 3. **Role-Based Access Control (RBAC)** ✅
Three user roles with different permissions:

| Role | Permissions |
|------|-------------|
| **user** | View strategies, run backtests, view results |
| **analyst** | Everything user can do + create/edit strategies |
| **admin** | Full access + delete strategies, manage users |

**Implementation**:
```javascript
const { authenticate, authorize } = require('../middleware/auth');

// Require authentication
router.post('/strategies', authenticate, createStrategy);

// Require specific role
router.delete('/strategies/:id', 
  authenticate, 
  authorize('admin', 'analyst'),
  deleteStrategy
);
```

**Current Route Protection**:
- ✅ `POST /api/backtest/run` - Optional auth (better tracking if authenticated)
- ✅ `GET /api/backtest/results` - Optional auth
- ✅ `DELETE /api/backtest/results/:id` - **Requires authentication**
- ✅ `POST /api/strategies` - **Requires authentication**
- ✅ `PUT /api/strategies/:id` - **Requires authentication**
- ✅ `DELETE /api/strategies/:id` - **Requires authentication**

---

### 4. **Input Validation** ✅
Comprehensive validation using `express-validator`.

**Validations Implemented**:

**User Registration**:
- Username: 3-30 chars, alphanumeric + underscores
- Email: Valid email format
- Password: Min 6 chars, must include uppercase, lowercase, and number

**Backtest Request**:
- Symbol: 1-10 uppercase letters
- Dates: ISO 8601 format, end date > start date
- Initial capital: $100 - $100,000,000
- Strategy code: Max 50KB

**Strategy Creation**:
- Name: 3-100 characters
- Description: Max 1000 characters
- Code: Max 50KB
- Parameters: Must be valid JSON object

**OHLCV Queries**:
- Symbol: Uppercase letters only
- Dates: ISO 8601 format
- Limit: 1-10,000
- Skip: Non-negative integer

**MongoDB IDs**:
- All ID parameters validated for proper MongoDB ObjectId format

---

### 5. **Rate Limiting** ✅
Protection against brute force and DDoS attacks.

**General API Rate Limit**:
```javascript
15 minutes window
100 requests per IP
```

**Authentication Rate Limit** (stricter):
```javascript
15 minutes window
5 attempts per IP (login/register)
Only failed attempts counted
```

**Headers Added**:
- `X-RateLimit-Limit` - Max requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Time when limit resets

---

### 6. **Helmet.js Security Headers** ✅
Automatic security headers for common vulnerabilities.

**Headers Set**:
- `X-DNS-Prefetch-Control` - Controls DNS prefetching
- `X-Frame-Options` - Prevents clickjacking
- `X-Content-Type-Options` - Prevents MIME-sniffing
- `X-XSS-Protection` - XSS filter for older browsers
- `Strict-Transport-Security` - Enforces HTTPS
- `Content-Security-Policy` - Controls resource loading

---

## 🔐 Environment Variables

Add these to your `.env` file:

```env
# Database
MONGODB_URI=mongodb+srv://...

# Server
PORT=5000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*
```

**⚠️ IMPORTANT**: 
- Change `JWT_SECRET` to a strong random string in production
- Use a proper secret manager (AWS Secrets Manager, Vault) in production
- Never commit `.env` to version control

---

## 🚀 Using the Secure API

### 1. Create an Account
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "trader1",
    "email": "trader@example.com",
    "password": "SecurePass123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "password": "SecurePass123"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "username": "trader1",
    "email": "trader@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Use Token for Protected Endpoints
```bash
curl -X POST http://localhost:5000/api/strategies \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Strategy",
    "description": "Custom trading strategy",
    "code": "function(data, params) { return null; }",
    "parameters": {}
  }'
```

---

## 🛡️ Security Best Practices

### Production Checklist
- [ ] Generate strong random `JWT_SECRET` (use `openssl rand -base64 32`)
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS only
- [ ] Configure strict CORS origins (not `*`)
- [ ] Enable MongoDB authentication
- [ ] Rotate credentials regularly
- [ ] Implement refresh tokens for long sessions
- [ ] Add token blacklist for logout
- [ ] Enable audit logging
- [ ] Set up monitoring and alerting
- [ ] Implement account lockout after failed attempts
- [ ] Add email verification
- [ ] Implement password reset flow
- [ ] Add 2FA for admin accounts

### Code Security
- [ ] Regular dependency updates (`npm audit`)
- [ ] Use environment-specific configs
- [ ] Never log sensitive data
- [ ] Sanitize all user inputs
- [ ] Use parameterized queries (Mongoose does this)
- [ ] Implement CSP (Content Security Policy)
- [ ] Add CSRF protection for cookies
- [ ] Use secure session storage

---

## 📊 Migration Guide

### For Existing Users
1. All existing API calls will continue to work (optional auth)
2. To access protected features:
   - Register an account at `/api/auth/register`
   - Login to receive JWT token
   - Include token in `Authorization` header

### Frontend Integration
Update your API service to include auth token:

```javascript
// services/api.js
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 🔍 Testing Security

### Test Rate Limiting
```bash
# Send 10 requests rapidly
for i in {1..10}; do
  curl http://localhost:5000/api/health
done
```

### Test Authentication
```bash
# Try accessing protected route without token
curl -X POST http://localhost:5000/api/strategies

# Should return 401 Unauthorized
```

### Test Input Validation
```bash
# Try invalid email
curl -X POST http://localhost:5000/api/auth/register \
  -d '{"email": "invalid", "username": "test", "password": "123"}'

# Should return 400 with validation errors
```

---

## 📝 API Documentation

Swagger documentation available at: `/api-docs` (to be implemented)

---

## 🆘 Support

For security issues, please report to: security@yourdomain.com

**Last Updated**: November 23, 2025

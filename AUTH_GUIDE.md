# Authentication System Guide

## Overview

The platform now includes a complete JWT-based authentication system with role-based access control (RBAC).

## Features

### 🔐 Authentication
- **Registration**: Create new accounts with username, email, and password
- **Login**: Secure JWT-based authentication
- **Profile Management**: View and manage user profiles
- **Auto-logout**: Automatic session expiration handling

### 👥 User Roles
- **User**: Can view strategies and run backtests
- **Analyst**: Can create, edit, and delete strategies
- **Admin**: Full access to all features

### 🛡️ Security Features
- JWT token-based authentication (7-day expiration)
- Password hashing with bcrypt (10 rounds)
- VM2 sandboxing for custom strategy code
- Input validation on all endpoints
- Rate limiting (100 req/15min general, 5 req/15min auth)
- Helmet.js security headers

## Using the Authentication System

### 1. Register a New Account

Navigate to `/register` or click "Create Account" from the landing page:

```
Username: trader1
Email: trader@example.com
Password: Secure123 (min 6 chars, uppercase, lowercase, number)
```

### 2. Login

Navigate to `/login` or click "Login" from the navigation:

```
Email: trader@example.com
Password: Secure123
```

After login, you'll be redirected to the dashboard and see your username in the navigation bar.

### 3. View Profile

Click on your username in the navigation to view:
- Account information
- Role and permissions
- Last login time
- Logout option

### 4. Guest Access

Click "Continue as Guest" to browse without authentication. Some features may be restricted.

## API Integration

### Making Authenticated Requests

The API service automatically adds JWT tokens to requests:

```javascript
import { runBacktest, createStrategy } from './services/api';

// Token is automatically included in headers
const result = await runBacktest({
  symbol: 'AAPL',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  strategyId: 'strategy-id',
  initialCapital: 10000
});
```

### Token Storage

Tokens are stored in localStorage:
- `auth_token`: JWT token
- `user`: User information (username, email, role)

### Session Expiration

When your token expires (after 7 days):
1. You'll see an error toast
2. You'll be redirected to the login page
3. Simply log in again to continue

## Protected Routes

The `/profile` route is protected and requires authentication. Attempting to access it without logging in will redirect you to the login page.

To protect additional routes, wrap them with the `ProtectedRoute` component:

```jsx
<Route 
  path="/admin" 
  element={
    <ProtectedRoute>
      <AdminPanel />
    </ProtectedRoute>
  } 
/>
```

## Role-Based Permissions

### User Role (Default)
- ✅ View strategies
- ✅ Run backtests
- ✅ View results
- ❌ Create/edit strategies

### Analyst Role
- ✅ All User permissions
- ✅ Create strategies
- ✅ Edit strategies
- ✅ Delete strategies
- ❌ Admin features

### Admin Role
- ✅ All Analyst permissions
- ✅ Full system access
- ✅ User management (future feature)

## Error Handling

The system provides helpful error messages for:

- **Invalid credentials**: "Invalid email or password"
- **Duplicate registration**: "User already exists"
- **Session expired**: "Session expired. Please login again"
- **Rate limiting**: "Too many requests. Please try again later"
- **Permission denied**: "You do not have permission to perform this action"

## Environment Variables

Make sure these are set in your `.env` file:

```env
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

**Important**: Change `JWT_SECRET` to a random secure string in production!

## Testing Authentication

### 1. Create Test Users

```bash
# Register as a regular user
POST /api/auth/register
{
  "username": "testuser",
  "email": "user@test.com",
  "password": "Test123"
}

# Register as an analyst (requires admin to change role in database)
POST /api/auth/register
{
  "username": "analyst",
  "email": "analyst@test.com",
  "password": "Test123"
}
```

### 2. Test Login

```bash
POST /api/auth/login
{
  "email": "user@test.com",
  "password": "Test123"
}

# Response includes token and user info
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "user@test.com",
    "role": "user"
  }
}
```

### 3. Test Protected Endpoint

```bash
GET /api/auth/me
Authorization: Bearer your-jwt-token-here

# Response
{
  "success": true,
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "user@test.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Common Issues

### "Session expired" on every request
- Check that `JWT_SECRET` is the same in all environments
- Verify token is being stored in localStorage
- Check browser console for CORS errors

### Can't login after registration
- Verify MongoDB connection is working
- Check backend logs for bcrypt errors
- Ensure password meets validation requirements

### Rate limiting blocking requests
- Wait 15 minutes for limit to reset
- Check if multiple tabs are open
- Contact admin if issue persists

## Next Steps

1. **Email Verification**: Add email confirmation for new registrations
2. **Password Reset**: Implement forgot password functionality
3. **2FA**: Add two-factor authentication option
4. **OAuth**: Integrate Google/GitHub login
5. **Admin Panel**: Add user management interface

## Support

For issues or questions:
1. Check the [SECURITY.md](./SECURITY.md) documentation
2. Review backend logs for detailed error messages
3. Test with Postman/curl to isolate frontend vs backend issues
